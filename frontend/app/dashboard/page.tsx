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
      console.log('SESSION:', session);
      console.log('ACCESS TOKEN:', session?.access_token);
      if (!session) {
        router.push('/');
        return;
      }

      try {
        const profileData = await fetchProfile(session.access_token);
        setProfile(profileData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  if (loading) return <div>Loading…</div>;
  if (!profile) return <div>Profile not found</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Name: {profile.full_name}</p>
      <p>Email: {profile.email}</p>
      <p>Department: {profile.department}</p>
      <p>Semester: {profile.semester}</p>
    </div>
  );
}