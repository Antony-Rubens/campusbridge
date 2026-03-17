'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Role = 'student' | 'faculty' | 'system_admin'
interface NavItem { href: string; label: string; icon: React.ReactNode }

const Icon = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const studentNav: NavItem[] = [
  { href: '/dashboard',       label: 'Dashboard',       icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" /> },
  { href: '/discover',        label: 'Discover',         icon: <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> },
  { href: '/communities',     label: 'Communities',      icon: <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" /> },
  { href: '/certificates',    label: 'Certificates',     icon: <Icon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" /> },
  { href: '/activity-points', label: 'Activity Points',  icon: <Icon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /> },
  { href: '/notifications',   label: 'Notifications',    icon: <Icon d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0" /> },
  { href: '/profile',         label: 'Profile',          icon: <Icon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z" /> },
]

const facultyNav: NavItem[] = [
  { href: '/faculty',          label: 'Review Portal',   icon: <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2 M9 14l2 2 4-4" /> },
  { href: '/faculty/students', label: 'My Students',     icon: <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" /> },
  { href: '/notifications',    label: 'Notifications',   icon: <Icon d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0" /> },
  { href: '/profile',          label: 'Profile',         icon: <Icon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z" /> },
]

const adminNav: NavItem[] = [
  { href: '/admin',             label: 'Dashboard',      icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" /> },
  { href: '/admin/departments', label: 'Departments',    icon: <Icon d="M3 21h18 M5 21V7l8-4v18 M19 21V11l-6-4" /> },
  { href: '/admin/batches',     label: 'Batches',        icon: <Icon d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /> },
  { href: '/admin/users',       label: 'Users',          icon: <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" /> },
  { href: '/admin/communities', label: 'Communities',    icon: <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" /> },
  { href: '/admin/ktu-rules',   label: 'KTU Rules',      icon: <Icon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /> },
  { href: '/admin/reports',     label: 'Reports',        icon: <Icon d="M18 20V10 M12 20V4 M6 20v-6" /> },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [notifCount, setNotifCount] = useState(0)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Detect current theme
    const t = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' || 'light'
    setTheme(t)

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', user.id)
        .single()
      if (data) { setProfile(data); setRole(data.role as Role) }
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .eq('is_read', false)
      setNotifCount(count || 0)
    }
    load()
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('cb-theme', next) } catch(e) {}
  }

  const navItems = role === 'system_admin' ? adminNav : role === 'faculty' ? facultyNav : role === 'student' ? studentNav : []
  const roleLabel = role === 'system_admin' ? 'System Admin' : role === 'faculty' ? 'Faculty' : 'Student'
  const roleColor = role === 'system_admin' ? 'var(--purple)' : role === 'faculty' ? 'var(--green)' : 'var(--accent)'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, width: '240px', height: '100vh',
      background: 'var(--bg-2)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Geometric logo mark */}
          <div style={{
            width: '32px', height: '32px', background: '#0a2d6e',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <div style={{
              width: '14px', height: '14px',
              border: '2.5px solid #c8a84b',
              borderRadius: '2px',
              transform: 'rotate(45deg)',
            }} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.02em' }}>
              CampusBridge
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.04em' }}>
              AISAT · KTU
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '1px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && item.href !== '/admin' && item.href !== '/faculty' &&
             pathname.startsWith(item.href))
          const isNotif = item.href === '/notifications'
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              fontSize: '13px', fontWeight: isActive ? '600' : '400',
              color: isActive ? 'var(--accent)' : 'var(--text-2)',
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              transition: 'all 0.12s', textDecoration: 'none', position: 'relative',
            }}
            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)' }}
            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{ opacity: isActive ? 1 : 0.55, flexShrink: 0, color: isActive ? 'var(--accent)' : 'var(--text-2)' }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {isNotif && notifCount > 0 && (
                <span style={{
                  background: 'var(--accent)', color: '#fff',
                  fontSize: '10px', fontWeight: '700', borderRadius: '99px',
                  padding: '1px 6px', minWidth: '18px', textAlign: 'center',
                }}>
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: '10px 10px 16px', borderTop: '1px solid var(--border)' }}>
        {/* Theme toggle */}
        <button onClick={toggleTheme} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 12px', borderRadius: 'var(--radius-sm)',
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontSize: '13px', color: 'var(--text-3)', fontFamily: 'Plus Jakarta Sans, sans-serif',
          transition: 'all 0.12s', marginBottom: '4px',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: '14px' }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: `${roleColor}18`,
            border: `1px solid ${roleColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', flexShrink: 0, color: roleColor,
          }}>
            {profile?.full_name?.charAt(0) || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.full_name || '...'}
            </div>
            <div style={{ fontSize: '10px', color: roleColor, fontWeight: '500' }}>{roleLabel}</div>
          </div>
        </div>

        <button onClick={handleSignOut} style={{
          width: '100%', padding: '7px 12px',
          background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-3)', fontSize: '12px', cursor: 'pointer',
          fontFamily: 'Plus Jakarta Sans, sans-serif', textAlign: 'left',
          transition: 'color 0.12s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}