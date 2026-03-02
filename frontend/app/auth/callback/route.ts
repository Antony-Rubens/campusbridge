import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/?error=${error}`)
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError || !data?.user) {
      console.error('Exchange error:', exchangeError)
      return NextResponse.redirect(`${origin}/?error=exchange_failed`)
    }

    // Check profile completion
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_profile_complete')
      .eq('id', data.user.id)
      .single()

    return NextResponse.redirect(
      profile?.is_profile_complete
        ? `${origin}/dashboard`
        : `${origin}/register-details`
    )
  }

  return NextResponse.redirect(`${origin}/`)
}