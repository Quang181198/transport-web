'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getCurrentSessionProfile, signOutUser } from '@/lib/auth/session'
import type { UserRole } from '@/lib/types/auth'

type Props = {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export default function AuthGuard({ children, allowedRoles }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    let mounted = true

    async function checkAccess() {
      try {
        const profile = await getCurrentSessionProfile()

        if (!profile) {
          router.replace(`/login?next=${encodeURIComponent(pathname || '/dashboard')}`)
          return
        }

        if (allowedRoles && !allowedRoles.includes(profile.role)) {
          if (mounted) {
            setDenied(true)
            setChecking(false)
          }
          return
        }

        if (mounted) {
          setAllowed(true)
        }
      } catch (error) {
        console.error(error)

        try {
          await signOutUser()
        } catch (signOutError) {
          console.error(signOutError)
        }

        router.replace('/login?error=access')
      } finally {
        if (mounted) {
          setChecking(false)
        }
      }
    }

    void checkAccess()

    return () => {
      mounted = false
    }
  }, [allowedRoles, pathname, router])

  if (checking) return null
  
  if (denied) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#f8fafc',
          padding: 20,
          fontFamily: 'Inter, sans-serif'
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
          Truy cập bị từ chối
        </h2>
        <p style={{ color: '#64748b', fontSize: 16, marginBottom: 24 }}>
          Bạn không có quyền truy cập module này.
        </p>
        <button
          onClick={() => router.replace('/dashboard')}
          style={{
            background: '#0f172a',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 8,
            fontWeight: 500,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Quay lại trang chủ
        </button>
      </div>
    )
  }

  if (!allowed) return null

  return <>{children}</>
}