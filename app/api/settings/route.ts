import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_KEYS = [
  'company_name',
  'company_short_name',
  'company_address',
  'company_phone',
  'company_hotline',
  'company_email',
  'company_email_alt',
  'company_website',
  'company_tax_code',
  'company_logo_url',
  'company_signature_url',
  'app_name',
  'app_description',
] as const

type AllowedKey = (typeof ALLOWED_KEYS)[number]

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const settings = Object.fromEntries(
      (data ?? []).map((row) => [row.key, row.value]),
    )

    return NextResponse.json({ settings })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: Record<string, unknown> = await request.json()

    const upserts = Object.entries(body)
      .filter(([key]) => (ALLOWED_KEYS as readonly string[]).includes(key))
      .map(([key, value]) => ({
        key: key as AllowedKey,
        value: String(value ?? ''),
      }))

    if (upserts.length === 0) {
      return NextResponse.json(
        { error: 'No valid keys provided' },
        { status: 400 },
      )
    }

    const { error } = await supabase
      .from('app_settings')
      .upsert(upserts, { onConflict: 'key' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
