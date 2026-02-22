'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseclient'
import { useRouter } from 'next/navigation'
import { createProfile } from '../../lib/api'

export default function RegisterDetails() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    github_link: '',
    linkedin_id: '',
    department: '',
    semester: '',
    roll_number: '',
    phone: '',
    skills: '',
    interests: '',
    role: 'student',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        alert('You are not logged in. Please sign in again.')
        router.push('/')
        return
      }

      await createProfile(session.access_token, {
        full_name: formData.full_name,
        github_link: formData.github_link || undefined,
        linkedin_id: formData.linkedin_id || undefined,
        department: formData.department || undefined,
        semester: formData.semester || undefined,
        roll_number: formData.roll_number || undefined,
        phone: formData.phone || undefined,
        skills: formData.skills
          ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        interests: formData.interests
          ? formData.interests.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        role: formData.role,
      })

      router.push('/dashboard')
    } catch (err: any) {
      alert(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-8 bg-white shadow-xl rounded-lg border">
      <h2 className="text-2xl font-bold mb-2 text-blue-600">Finalize Your Profile</h2>
      <p className="text-sm text-gray-500 mb-6">
        Fill in your details to get started with CampusBridge.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            I am a...
          </label>
          <select
            className="w-full p-2 border rounded bg-white"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="student">Student</option>
            <option value="faculty">Faculty Coordinator (requires admin approval)</option>
          </select>
          {formData.role === 'faculty' && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Faculty accounts require approval by a system administrator before you can verify certificates or approve activity points.
            </p>
          )}
        </div>

        {/* Full Name */}
        <input
          type="text"
          placeholder="Full Name *"
          required
          className="w-full p-2 border rounded"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
        />

        {/* Roll Number + Phone */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Roll Number"
            className="p-2 border rounded"
            value={formData.roll_number}
            onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
          />
          <input
            type="tel"
            placeholder="Phone Number"
            className="p-2 border rounded"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        {/* Department + Semester */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Department (e.g. CSE)"
            className="p-2 border rounded"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
          <select
            className="p-2 border rounded bg-white"
            value={formData.semester}
            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
          >
            <option value="">Select Semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={String(s)}>Semester {s}</option>
            ))}
          </select>
        </div>

        {/* GitHub + LinkedIn */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="url"
            placeholder="GitHub Profile URL"
            className="p-2 border rounded"
            value={formData.github_link}
            onChange={(e) => setFormData({ ...formData, github_link: e.target.value })}
          />
          <input
            type="text"
            placeholder="LinkedIn ID"
            className="p-2 border rounded"
            value={formData.linkedin_id}
            onChange={(e) => setFormData({ ...formData, linkedin_id: e.target.value })}
          />
        </div>

        {/* Skills */}
        <div>
          <textarea
            placeholder="Skills (e.g. Python, React, C++ — separate by commas)"
            className="w-full p-2 border rounded h-20"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          />
        </div>

        {/* Interests */}
        <div>
          <textarea
            placeholder="Interests (e.g. AI, Robotics, Music — separate by commas)"
            className="w-full p-2 border rounded h-20"
            value={formData.interests}
            onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Finish Registration'}
        </button>
      </form>
    </div>
  )
}