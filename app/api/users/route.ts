import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function isValidUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export async function GET() {
  try {
    const supabase = createClient()

    // Fetch from user_profiles
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, is_active')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sort users, typically putting active/admin first or alphabetically by email
    const sortedUsers = (users ?? []).sort((a, b) => {
      const emailA = a.email || ''
      const emailB = b.email || ''
      return emailA.localeCompare(emailB)
    })

    return NextResponse.json({ users: sortedUsers })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cannot load users' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const payload = await req.json()
    const supabase = createClient()

    if (!payload.id || !isValidUuid(payload.id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    if (!payload.role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        role: payload.role,
        is_active: payload.is_active ?? true,
      })
      .eq('id', payload.id)
      .select('id, email, full_name, role, is_active')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'User updated successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cannot update user' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const supabase = createClient()

    if (!payload.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!payload.role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 })
    }

    // 1. Send an invite email to create the auth identity via Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
      payload.email,
      {
        data: {
          full_name: payload.full_name || '',
        },
      }
    )

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Cannot create auth user' }, { status: 500 })
    }

    const userId = authData.user.id

    // 2. Safely sync the public user_profiles. Sometimes a trigger creates this automatically.
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    let dbError

    if (existingProfile) {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: payload.full_name || '',
          role: payload.role,
          is_active: payload.is_active ?? true,
        })
        .eq('id', userId)
      dbError = error
    } else {
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: payload.email,
          full_name: payload.full_name || '',
          role: payload.role,
          is_active: payload.is_active ?? true,
        })
      dbError = error
    }

    if (dbError) {
      // 3. Rollback
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cannot create user' },
      { status: 500 }
    )
  }
}
