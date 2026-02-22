'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseclient'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', session.user.id)
            .single()
          setProfile(data)
        } else {
          setProfile(null)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user || pathname === '/') return null

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">

        {/* Left — Logo + Links */}
        <div className="flex items-center gap-8">
          <span className="font-extrabold text-blue-600 text-xl tracking-tight">
            CampusBridge
          </span>

          <div className="flex items-center gap-6">
            <Link
              href="/explore"
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith('/explore')
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-0.5'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Explore
            </Link>

            <Link
              href="/discover"
              className={`text-sm font-medium transition-colors ${
                pathname === '/discover'
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-0.5'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Discover
            </Link>

            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-0.5'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Dashboard
            </Link>

            {/* Show Activity Points link for students */}
            {profile?.role === 'student' && (
              <Link
                href="/activity-points"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/activity-points'
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-0.5'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Activity Points
              </Link>
            )}

            {/* Show Faculty panel link for faculty */}
            {(profile?.role === 'faculty' || profile?.role === 'system_admin') && (
              <Link
                href="/faculty"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/faculty'
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-0.5'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Faculty Panel
              </Link>
            )}
          </div>
        </div>

        {/* Right — User info + Sign out */}
        <div className="flex items-center gap-4">
          {profile && (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">
                {profile.full_name || user.email}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {profile.role || 'student'}
              </p>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>

      </div>
    </nav>
  )
}