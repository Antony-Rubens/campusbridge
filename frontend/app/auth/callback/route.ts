import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session) {
      const userId = session.user.id
      const userEmail = session.user.email

      // Try find profile by id first
      let { data: profile } = await supabase
        .from('profiles')
        .select('id, role, is_profile_complete')
        .eq('id', userId)
        .single()

      // Fall back to email match (pre-created profiles from CSV)
      if (!profile && userEmail) {
        const { data: byEmail } = await supabase
          .from('profiles')
          .select('id, role, is_profile_complete')
          .eq('email', userEmail)
          .single()

        if (byEmail) {
          // Update the pre-created profile id to match real auth UUID
          await supabase
            .from('profiles')
            .update({ id: userId })
            .eq('email', userEmail)
          profile = { ...byEmail, id: userId }
        }
      }

      if (!profile) {
        // No profile — account not set up by admin yet
        return NextResponse.redirect(`${origin}/register-details`)
      }

      if (!profile.is_profile_complete) {
        return NextResponse.redirect(`${origin}/register-details`)
      }

      // Redirect based on actual role in DB — ignore landing page selection
      // The landing page role selector is only UX guidance, not access control
      if (profile.role === 'system_admin') return NextResponse.redirect(`${origin}/admin`)
      if (profile.role === 'faculty') return NextResponse.redirect(`${origin}/faculty`)
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}