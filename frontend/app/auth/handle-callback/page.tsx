'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function HandleCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get('code')

      if (code) {
        // Exchange the code — works here because the code verifier
        // is in localStorage, accessible to this browser client
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('Exchange error:', error)
          router.push('/?error=exchange_failed')
          return
        }
      }

      // Wait for session to be established
      await new Promise(r => setTimeout(r, 300))

      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push('/?error=no_session')
        return
      }

      // Check profile completion
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_profile_complete')
        .eq('id', session.user.id)
        .single()

      router.push(profile?.is_profile_complete ? '/dashboard' : '/register-details')
    }

    run()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Signing you in…</p>
      </div>
    </div>
  )
}

export default function HandleCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HandleCallbackInner />
    </Suspense>
  )
}