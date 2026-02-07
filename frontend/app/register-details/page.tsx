'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseclient'
import { useRouter } from 'next/navigation'

export default function RegisterDetails() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    github: '',
    linkedin: '',
    department: '',
    communities: '',
    skills: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check if the profile already exists to prevent "new" entries for existing users
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: formData.name,
        email: user.email,
        github_link: formData.github,
        linkedin_id: formData.linkedin,
        department: formData.department,
        communities: formData.communities.split(',').map(s => s.trim()),
        skills: formData.skills.split(',').map(s => s.trim()),
      });

    if (error) {
      // Catch the Unique Constraint error from Step 1
      if (error.code === '23505') {
        alert("Error: This GitHub link or LinkedIn ID is already in use by another student.");
      } else {
        alert("Database Error: " + error.message);
      }
    } else {
      router.push('/dashboard');
    }
  }
  setLoading(false);
};

  return (
    <div className="max-w-xl mx-auto mt-10 p-8 bg-white shadow-xl rounded-lg border">
      <h2 className="text-2xl font-bold mb-6 text-blue-600">Finalize Your Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Full Name" required className="w-full p-2 border rounded" 
          onChange={(e) => setFormData({...formData, name: e.target.value})} />
        
        <div className="grid grid-cols-2 gap-4">
          <input type="url" placeholder="GitHub Profile URL" className="p-2 border rounded" 
            onChange={(e) => setFormData({...formData, github: e.target.value})} />
          <input type="text" placeholder="LinkedIn ID" className="p-2 border rounded" 
            onChange={(e) => setFormData({...formData, linkedin: e.target.value})} />
        </div>

        <input type="text" placeholder="Department" className="w-full p-2 border rounded" 
          onChange={(e) => setFormData({...formData, department: e.target.value})} />

        <textarea placeholder="Skills (e.g. C, Python, React - separate by commas)" className="w-full p-2 border rounded h-24" 
          onChange={(e) => setFormData({...formData, skills: e.target.value})} />

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition">
          {loading ? 'Saving...' : 'Finish Registration'}
        </button>
      </form>
    </div>
  )
}