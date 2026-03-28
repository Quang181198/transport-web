'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import type { SessionProfile, DatabaseProfile } from '@/lib/types/auth'
import { isUserRole } from '@/lib/types/auth'

export async function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signOutUser() {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}

export async function getCurrentSessionProfile(): Promise<SessionProfile | null> {
  const supabase = createBrowserClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    throw new Error(profileError.message)
  }

  const typedProfile = profile as DatabaseProfile | null

  if (!typedProfile) {
    throw new Error('This account does not have a user_profiles record')
  }

  if (!typedProfile.is_active) {
    throw new Error('This account has been deactivated')
  }

  if (!isUserRole(typedProfile.role)) {
    throw new Error(`Invalid role: ${typedProfile.role}`)
  }

  return {
    id: typedProfile.id,
    email: typedProfile.email || user.email || '',
    fullName: typedProfile.full_name || '',
    role: typedProfile.role,
    isActive: Boolean(typedProfile.is_active),
  }
}