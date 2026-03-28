import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    if (!payload.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // We use a regular unprivileged client to trigger the generic password reset email
    // This correctly forces Supabase to dispatch the email via standard templates
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // Create an isolated anon client specifically to trigger the reset
    const isolatedClient = createClient(supabaseUrl, supabaseAnonKey)

    const { error } = await isolatedClient.auth.resetPasswordForEmail(payload.email)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: (error as Error).message || 'Internal server error' }, { status: 500 })
  }
}
