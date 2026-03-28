'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import CompanyLogo from '@/components/layout/company-logo'
import { getCurrentSessionProfile, signInWithEmail, signOutUser } from '@/lib/auth/session'
import { canAccessPath, getDefaultRouteByRole } from '@/lib/types/auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const nextParam = searchParams.get('next') || ''
  const errorParam = searchParams.get('error') || ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorText, setErrorText] = useState('')

  const initialError = useMemo(() => {
    if (errorParam === 'access') {
      return 'Your account is not authorized or your role profile is missing.'
    }
    return ''
  }, [errorParam])

  useEffect(() => {
    if (initialError) {
      setErrorText(initialError)
    }
  }, [initialError])

  useEffect(() => {
    let mounted = true

    async function autoRedirectIfLoggedIn() {
      try {
        const profile = await getCurrentSessionProfile()
        if (!profile || !mounted) return

        const target =
          nextParam.startsWith('/') && canAccessPath(profile.role, nextParam)
            ? nextParam
            : getDefaultRouteByRole(profile.role)

        router.replace(target)
      } catch (error) {
        console.error(error)
      }
    }

    autoRedirectIfLoggedIn()

    return () => {
      mounted = false
    }
  }, [nextParam, router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setErrorText('')

    try {
      await signInWithEmail(email, password)

      const profile = await getCurrentSessionProfile()

      if (!profile) {
        throw new Error('Cannot load role profile after login')
      }

      const target =
        nextParam.startsWith('/') && canAccessPath(profile.role, nextParam)
          ? nextParam
          : getDefaultRouteByRole(profile.role)

      router.replace(target)
    } catch (error) {
      console.error(error)

      try {
        await signOutUser()
      } catch (signOutError) {
        console.error(signOutError)
      }

      setErrorText(
        error instanceof Error ? error.message : 'Login failed',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-head">
          <CompanyLogo size={56} />
          <div>
            <h1>HD Transport</h1>
            <p>Sign in to the transport management system</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="sale.hdtransport@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="field" style={{ marginTop: 14 }}>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {errorText && (
            <div
              style={{
                marginTop: 14,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b91c1c',
                fontSize: 14,
              }}
            >
              {errorText}
            </div>
          )}

          <div
            style={{
              marginTop: 14,
              fontSize: 13,
              color: '#64748b',
              lineHeight: 1.5,
              background: '#f8fafc',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr', gap: '6px 10px', whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Admin:</span> <span>admin.hdtransport@gmail.com</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Manager:</span> <span>hdtransporttravel@gmail.com</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Manager:</span> <span>manager.hdtransport@gmail.com</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Sales:</span> <span>sales.hdtransport@gmail.com</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Operator:</span> <span>operator.hdtransport@gmail.com</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Accountant:</span> <span>accountant.hdtransport@gmail.com</span>
            </div>
          </div>

          <div className="login-actions">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}