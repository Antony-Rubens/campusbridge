'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Tab = 'users' | 'communities' | 'certificates'

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<any[]>([])
  const [communities, setCommunities] = useState<any[]>([])
  const [pendingCerts, setPendingCerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'system_admin') { router.push('/dashboard'); return }

      const [usersRes, commRes, certsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('communities').select('*, creator:profiles!communities_created_by_fkey(full_name)').order('created_at', { ascending: false }),
        supabase.from('certificates').select('*, profile:profiles(full_name, department)').eq('status', 'pending').order('created_at', { ascending: false }),
      ])

      setUsers(usersRes.data ?? [])
      setCommunities(commRes.data ?? [])
      setPendingCerts(certsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  const handleRoleChange = async (userId: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
  }

  const handleToggleCommunity = async (commId: string, isActive: boolean) => {
    await supabase.from('communities').update({ is_active: !isActive }).eq('id', commId)
    setCommunities(prev => prev.map(c => c.id === commId ? { ...c, is_active: !isActive } : c))
  }

  const filteredUsers = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'users', label: 'Users', count: users.length },
    { key: 'communities', label: 'Communities', count: communities.length },
    { key: 'certificates', label: 'Pending Certs', count: pendingCerts.length },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        <div>
          <h1 className="text-2xl font-black text-white">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Manage users, communities, and certificates</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Users', value: users.length, color: 'text-blue-400' },
            { label: 'Communities', value: communities.length, color: 'text-purple-400' },
            { label: 'Pending Review', value: pendingCerts.length, color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-slate-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === t.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {t.label}
              {t.count > 0 && <span className="ml-1.5 text-xs opacity-70">({t.count})</span>}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 w-full sm:w-72"
            />
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-800">
                  <tr>
                    {['Name', 'Email', 'Dept', 'Sem', 'Role', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 text-white font-medium">{u.full_name || '—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{u.email}</td>
                      <td className="px-4 py-3 text-slate-400">{u.department || '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{u.semester || '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role || 'student'}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                        >
                          <option value="student">Student</option>
                          <option value="faculty">Faculty</option>
                          <option value="community_admin">Community Admin</option>
                          <option value="system_admin">System Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${u.is_profile_complete ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                          {u.is_profile_complete ? 'Complete' : 'Incomplete'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Communities Tab */}
        {tab === 'communities' && (
          <div className="space-y-3">
            {communities.map(c => (
              <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white font-semibold">{c.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {c.category} · {c.department || 'All depts'} · by {c.creator?.full_name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${c.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleToggleCommunity(c.id, c.is_active)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    {c.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending Certificates Tab */}
        {tab === 'certificates' && (
          <div className="space-y-3">
            {pendingCerts.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <p className="text-3xl mb-2">✅</p>
                <p>No pending certificates</p>
              </div>
            ) : (
              pendingCerts.map(cert => (
                <div key={cert.id} className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-semibold text-sm">{cert.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {cert.profile?.full_name} · {cert.profile?.department} · {cert.activity_category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded-full">
                      {cert.suggested_points} pts suggested
                    </span>
                    {cert.file_url && (
                      <a href={cert.file_url} target="_blank" rel="noopener noreferrer"
                        className="text-blue-400 text-xs hover:underline">View</a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}