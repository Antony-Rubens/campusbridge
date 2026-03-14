'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Role = 'student' | 'faculty' | 'system_admin'

interface NavItem {
  href: string
  icon: string
  label: string
}

const studentNav: NavItem[] = [
  { href: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { href: '/discover', icon: '◈', label: 'Discover' },
  { href: '/communities', icon: '◉', label: 'Communities' },
  { href: '/certificates', icon: '◫', label: 'Certificates' },
  { href: '/activity-points', icon: '◎', label: 'Activity Points' },
  { href: '/notifications', icon: '◐', label: 'Notifications' },
  { href: '/profile', icon: '◯', label: 'Profile' },
]

const facultyNav: NavItem[] = [
  { href: '/faculty', icon: '◈', label: 'Review Portal' },
  { href: '/faculty/students', icon: '◉', label: 'My Students' },
  { href: '/notifications', icon: '◐', label: 'Notifications' },
  { href: '/profile', icon: '◯', label: 'Profile' },
]

const adminNav: NavItem[] = [
  { href: '/admin', icon: '⬡', label: 'Dashboard' },
  { href: '/admin/departments', icon: '◫', label: 'Departments' },
  { href: '/admin/batches', icon: '◈', label: 'Batches' },
  { href: '/admin/users', icon: '◉', label: 'Users' },
  { href: '/admin/communities', icon: '◎', label: 'Communities' },
  { href: '/admin/ktu-rules', icon: '◐', label: 'KTU Rules' },
  { href: '/admin/reports', icon: '◯', label: 'Reports' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(null)
  const [profile, setProfile] = useState<{ full_name: string; email: string; role: Role } | null>(null)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data)
        setRole(data.role as Role)
      }
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .eq('is_read', false)
      setNotifCount(count || 0)
    }
    load()
  }, [])

  // Don't render nav until role is loaded to prevent flash
  const navItems = role === 'system_admin' ? adminNav : role === 'faculty' ? facultyNav : role === 'student' ? studentNav : []

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const roleLabel = role === 'system_admin' ? 'System Admin' : role === 'faculty' ? 'Faculty' : 'Student'
  const roleBadgeColor = role === 'system_admin' ? '#a78bfa' : role === 'faculty' ? '#3ecf8e' : '#4f8ef7'

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '240px',
      height: '100vh',
      background: 'var(--bg-2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      padding: '20px 0',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #4f8ef7, #3ecf8e)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            flexShrink: 0,
          }}>🌉</div>
          <span style={{ fontWeight: '700', fontSize: '15px', letterSpacing: '-0.02em' }}>CampusBridge</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/admin' && item.href !== '/faculty' && pathname.startsWith(item.href))
          const isNotif = item.href === '/notifications'
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? 'var(--accent)' : 'var(--text-2)',
                background: isActive ? 'var(--accent-glow)' : 'transparent',
                transition: 'all 0.12s',
                position: 'relative',
                textDecoration: 'none',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{ fontSize: '14px', opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
              {isNotif && notifCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '700',
                  borderRadius: '99px',
                  padding: '1px 6px',
                  minWidth: '18px',
                  textAlign: 'center',
                }}>{notifCount > 9 ? '9+' : notifCount}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div style={{ padding: '12px 10px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '6px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: `${roleBadgeColor}20`,
            border: `1px solid ${roleBadgeColor}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            flexShrink: 0,
            color: roleBadgeColor,
            fontWeight: '700',
          }}>
            {profile?.full_name?.charAt(0) || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {profile?.full_name || 'Loading...'}
            </div>
            <div style={{
              fontSize: '10px',
              color: roleBadgeColor,
              fontWeight: '500',
              letterSpacing: '0.04em',
            }}>
              {roleLabel}
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-3)',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'Sora, sans-serif',
            textAlign: 'left',
            transition: 'color 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          ← Sign out
        </button>
      </div>
    </aside>
  )
}