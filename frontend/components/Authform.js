'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabaseclient';

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  // 1. Google Auth Logic
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'http://localhost:3000/dashboard' }
    })
    if (error) alert(error.message)
  }

  // 2. New Logineer (OTP) Logic
  const handleOTPLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: 'http://localhost:3000/register-details' }
    })
    if (error) alert(error.message)
    else alert('Check your email for the OTP link!')
    setLoading(false)
  }

  return (
    <div className="auth-container">
      {/* SECTION 1: Google Login */}
      <button onClick={handleGoogleLogin} className="google-btn">
        Continue with Google
      </button>

      <div className="divider"> OR </div>

      {/* SECTION 2: Email Registration */}
      <form onSubmit={handleOTPLogin}>
        <input 
          type="email" 
          placeholder="Enter your email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending OTP...' : 'Send Magic Link / OTP'}
        </button>
      </form>
    </div>
  )
}