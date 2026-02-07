'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseclient'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [certs, setCerts] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const getInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/')

      // 1. Fetch Profile Data from the profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      // 2. Fetch Existing Certificates from the certificates table
      const { data: certData } = await supabase
        .from('certificates')
        .select('*')
        .eq('student_id', user.id)
      setCerts(certData || [])
    }
    getInitialData()
  }, [router])

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Create a unique path for the file in storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${user?.id}/${Math.random()}.${fileExt}`

    // 3. Upload to Supabase Storage Bucket named 'certificates'
    const { error: storageError } = await supabase.storage
      .from('certificates')
      .upload(fileName, file)

    if (storageError) {
      alert("Error uploading file: " + storageError.message)
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(fileName)
      
      // 4. Save file link to 'certificates' table
      const { data: newCert, error: dbError } = await supabase
        .from('certificates')
        .insert({
          student_id: user?.id,
          file_url: publicUrl,
          cert_name: file.name
        })
        .select()
        .single()

      if (!dbError) setCerts([...certs, newCert])
      alert("Certificate uploaded and reflected in dashboard!")
    }
    setUploading(false)
  } 
    const handleDelete = async (certId:string, filePath:string) => {
    if (!confirm("Are you sure you want to delete this certificate?"))
       return;
   
  // 1. Delete from Storage
  const { error: storageError } = await supabase.storage
    .from('certificates')
    .remove([filePath]);

  if (!storageError) {
    // 2. Delete from Database
    await supabase.from('certificates').delete().eq('id', certId);
    // 3. Update UI
    setCerts(certs.filter(c => c.id !== certId));
  }
};

// 1. Add this function inside your Dashboard component, before the return statement:
const handleSignOut = async () => {
  await supabase.auth.signOut();
  router.push('/'); // Send them back to the login page
};

  if (!profile) return <div className="p-10 text-center">Loading Student Dashboard...</div>

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-2xl shadow-lg mb-8 flex justify-between items-center">
  <div>
    <h1 className="text-3xl font-bold">Student Dashboard</h1>
    <p className="mt-2 text-blue-100">Welcome back, {profile.full_name}</p>
  </div>
  <button 
    onClick={handleSignOut}
    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition backdrop-blur-sm border border-white/30"
  >
    Sign Out
  </button>
</div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Profile Details</h2>
            <div className="space-y-3 text-sm">
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Dept:</strong> {profile.department}</p>
              <p><strong>GitHub:</strong> <a href={profile.github_link} target="_blank" className="text-blue-600 underline">View Profile</a></p>
              <p><strong>LinkedIn ID:</strong> {profile.linkedin_id}</p>
            </div>
            <div className="mt-6">
              <h3 className="font-bold mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.map((skill: string) => (
                  <span key={skill} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Certificates */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Certificates</h2>
              <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                {uploading ? 'Uploading...' : 'Add Certificate'}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>

            {certs.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No certificates uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {certs.map((cert) => (
                  <div key={cert.id} className="p-4 border rounded-lg flex items-center justify-between hover:bg-gray-50 transition">
                    <span className="text-sm font-medium truncate pr-4">{cert.cert_name}</span>
                    <a href={cert.file_url} target="_blank" className="text-blue-600 text-xs font-bold hover:underline">
                      VIEW PDF
                    </a>
                    <button 
        onClick={() => handleDelete(cert.id, cert.file_url.split('/public/certificates/')[1])}
        className="text-red-500 text-xs font-bold hover:text-red-700"
      >DELETE</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}