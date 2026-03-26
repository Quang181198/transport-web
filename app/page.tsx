'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSessionProfile } from '@/lib/auth/session'
import { getDefaultRouteByRole } from '@/lib/types/auth'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    async function resolveEntry() {
      try {
        const profile = await getCurrentSessionProfile()

        if (!mounted) return

        if (!profile) {
          router.replace('/login')
          return
        }

        router.replace(getDefaultRouteByRole(profile.role))
      } catch (error) {
        console.error(error)
        router.replace('/login')
      }
    }

    resolveEntry()

    return () => {
      mounted = false
    }
  }, [router])

  return null
}