'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseclient';
import { fetchProfile } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.push('/');
        return;
      }

      try {
        const profileData = await fetchProfile(session.access_token);
        setProfile(profileData);
      } catch (err: any) {
        // Profile doesn't exist yet — send to registration
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          router.push('/register-details');
        } else {
          console.error('Dashboard load error:', err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-lg">Loading your dashboard...</p>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Could not load profile.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4 space-y-6">

      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">
              Welcome, {profile.full_name || 'Student'} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">{profile.email}</p>
            <span className="inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">
              {profile.role || 'student'}
            </span>
          </div>
          <button
            onClick={() => router.push('/register-details')}
            className="text-sm text-blue-600 hover:underline"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Academic Info */}
      <div className="bg-white shadow rounded-lg p-6 border">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Academic Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Department</p>
            <p className="font-medium text-gray-800">{profile.department || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">Semester</p>
            <p className="font-medium text-gray-800">
              {profile.semester ? `Semester ${profile.semester}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Roll Number</p>
            <p className="font-medium text-gray-800">{profile.roll_number || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">Phone</p>
            <p className="font-medium text-gray-800">{profile.phone || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">GitHub</p>
            {profile.github_link
              ? <a href={profile.github_link} target="_blank" rel="noreferrer"
                  className="text-blue-500 hover:underline font-medium">
                  View Profile
                </a>
              : <p className="font-medium text-gray-800">—</p>
            }
          </div>
          <div>
            <p className="text-gray-400">LinkedIn</p>
            {profile.linkedin_id
              ? <a href={`https://linkedin.com/in/${profile.linkedin_id}`}
                  target="_blank" rel="noreferrer"
                  className="text-blue-500 hover:underline font-medium">
                  View Profile
                </a>
              : <p className="font-medium text-gray-800">—</p>
            }
          </div>
        </div>
      </div>

      {/* KTU Activity Points */}
      <div className="bg-white shadow rounded-lg p-6 border">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          KTU Activity Points
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-blue-600">
            {profile.activity_points_total ?? 0}
          </div>
          <div className="text-sm text-gray-500">
            <p>points earned</p>
            <p className="text-xs text-gray-400">Maximum: 100 points (KTU limit)</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all"
            style={{ width: `${Math.min((profile.activity_points_total ?? 0), 100)}%` }}
          />
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white shadow rounded-lg p-6 border">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Skills</h2>
        {profile.skills && profile.skills.length > 0
          ? <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: string, i: number) => (
                <span key={i}
                  className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full border border-blue-200">
                  {skill}
                </span>
              ))}
            </div>
          : <p className="text-sm text-gray-400">No skills added yet.</p>
        }
      </div>

      {/* Interests */}
      <div className="bg-white shadow rounded-lg p-6 border">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Interests</h2>
        {profile.interests && profile.interests.length > 0
          ? <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest: string, i: number) => (
                <span key={i}
                  className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full border border-green-200">
                  {interest}
                </span>
              ))}
            </div>
          : <p className="text-sm text-gray-400">No interests added yet.</p>
        }
      </div>

      {/* Quick Links */}
      <div className="bg-white shadow rounded-lg p-6 border">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/discover')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition"
          >
            <p className="font-semibold text-blue-700">🔍 Discover Events</p>
            <p className="text-xs text-gray-500 mt-1">Browse upcoming campus events</p>
          </button>
          <button
            onClick={() => router.push('/explore')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition"
          >
            <p className="font-semibold text-green-700">🌐 Explore Communities</p>
            <p className="text-xs text-gray-500 mt-1">Find and join communities</p>
          </button>
        </div>
      </div>

    </div>
  );
}