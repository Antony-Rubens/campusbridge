'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0, students: 0, faculty: 0,
    communities: 0, pendingCommunities: 0,
    pendingCerts: 0, batches: 0, departments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [
        { count: users },
        { count: students },
        { count: faculty },
        { count: communities },
        { count: pendingCommunities },
        { count: pendingCerts },
        { count: batches },
        { count: departments },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'faculty'),
        supabase.from('communities').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('communities').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('batches').select('id', { count: 'exact', head: true }),
        supabase.from('departments').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        users: users || 0, students: students || 0, faculty: faculty || 0,
        communities: communities || 0, pendingCommunities: pendingCommunities || 0,
        pendingCerts: pendingCerts || 0, batches: batches || 0, departments: departments || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const quickActions = [
    { href: '/admin/communities', label: 'Review Communities', count: stats.pendingCommunities, color: 'var(--yellow)', urgent: stats.pendingCommunities > 0 },
    { href: '/admin/users', label: 'Manage Users', count: stats.users, color: 'var(--accent)', urgent: false },
    { href: '/admin/batches', label: 'Manage Batches', count: stats.batches, color: 'var(--green)', urgent: false },
    { href: '/admin/ktu-rules', label: 'KTU Rules', count: null, color: 'var(--purple)', urgent: false },
  ]

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Platform overview and management</p>
        </div>

        {/* Stats grid */}
        <div className="grid-4" style={{ marginBottom: '28px' }}>
          {[
            { label: 'Total Users', val: stats.users, color: 'var(--text)' },
            { label: 'Students', val: stats.students, color: 'var(--accent)' },
            { label: 'Faculty', val: stats.faculty, color: 'var(--green)' },
            { label: 'Departments', val: stats.departments, color: 'var(--purple)' },
            { label: 'Active Communities', val: stats.communities, color: 'var(--text)' },
            { label: 'Pending Communities', val: stats.pendingCommunities, color: 'var(--yellow)' },
            { label: 'Pending Certificates', val: stats.pendingCerts, color: 'var(--yellow)' },
            { label: 'Batches', val: stats.batches, color: 'var(--text)' },
          ].map(({ label, val, color }) => (
            <div key={label} className="stat-card">
              <div className="stat-value" style={{ color }}>{loading ? '—' : val}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <h3 style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
          Quick Actions
        </h3>
        <div className="grid-4">
          {quickActions.map(a => (
            <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                borderColor: a.urgent ? a.color + '40' : undefined,
                background: a.urgent ? a.color + '08' : undefined,
                cursor: 'pointer',
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: a.urgent ? a.color : 'var(--text)' }}>
                  {a.label}
                </div>
                {a.count !== null && (
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: a.color }}>{a.count}</div>
                )}
                {a.urgent && a.count && a.count > 0 && (
                  <div style={{ fontSize: '11px', color: a.color, marginTop: '4px' }}>⚠ Action needed</div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Nav links */}
        <div style={{ marginTop: '28px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/admin/departments" className="btn btn-ghost">Departments</Link>
          <Link href="/admin/batches" className="btn btn-ghost">Batches</Link>
          <Link href="/admin/users" className="btn btn-ghost">Users & Bulk Upload</Link>
          <Link href="/admin/communities" className="btn btn-ghost">Community Approvals</Link>
          <Link href="/admin/ktu-rules" className="btn btn-ghost">KTU Rules</Link>
          <Link href="/admin/reports" className="btn btn-ghost">Reports</Link>
        </div>
      </main>
    </div>
  )
}