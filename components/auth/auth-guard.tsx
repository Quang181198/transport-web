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
          window.alert('Bạn không có quyền truy cập module này.')
          router.replace('/dashboard')
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
  if (!allowed) return null

  return <>{children}</>
}