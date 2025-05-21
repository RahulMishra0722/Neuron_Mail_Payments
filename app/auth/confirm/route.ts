import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server' // Adjusted path

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/' // Default redirect to home page

  if (token_hash && type) {
    const supabase = await createClient() // Our server client
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // On successful OTP verification, Supabase sets the session cookie.
      // Redirect the user to the 'next' page (or home).
      // The middleware will recognize the new session on this redirect.
      return redirect(next)
    }
    
    // Log the error for server-side observability if needed
    console.error('OTP Verification Error:', error.message);
    // Redirect to login with a more specific error if possible, or a generic one
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('error', 'confirmation_failed')
    loginUrl.searchParams.set('message', error.message) // Optionally pass Supabase error message
    return redirect(loginUrl)
  }

  // If token_hash or type is missing, redirect to login with an error
  const loginUrl = new URL('/auth/login', request.url)
  loginUrl.searchParams.set('error', 'invalid_confirmation_link')
  return redirect(loginUrl)
}
