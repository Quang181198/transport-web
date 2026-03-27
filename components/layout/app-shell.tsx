'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import CompanyLogo from './company-logo'
import { getCurrentSessionProfile, signOutUser } from '@/lib/auth/session'
import {
  canAccessMenu,
  getRoleLabel,
  type AppMenuKey,
  type SessionProfile,
} from '@/lib/types/auth'

type Props = {
  title: string
  subtitle?: string
  children: React.ReactNode
  activeMenu?: AppMenuKey
}

const navItems: Array<{
  href: string
  label: string
  icon: string
  key: AppMenuKey
}> = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠', key: 'dashboard' },
  { href: '/bookings/new', label: 'New Booking', icon: '📝', key: 'bookings' },
  { href: '/dispatch', label: 'Dispatch', icon: '🚐', key: 'dispatch' },
  { href: '/resources', label: 'Resources', icon: '🧰', key: 'dispatch' },
  { href: '/services', label: 'Services', icon: '🧭', key: 'dispatch' },
  { href: '/accounting', label: 'Accounting', icon: '📊', key: 'accounting' },
]

export default function AppShell({
  title,
  subtitle,
  children,
  activeMenu,
}: Props) {
  const router = useRouter()
  const [profile, setProfile] = useState<SessionProfile | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadProfile() {
      try {
        const nextProfile = await getCurrentSessionProfile()
        if (mounted) {
          setProfile(nextProfile)
        }
      } catch (error) {
        console.error(error)
      }
    }

    void loadProfile()

    return () => {
      mounted = false
    }
  }, [])

  const visibleNavItems = useMemo(() => {
    if (!profile) {
      return navItems.filter((item) => item.key === 'dashboard')
    }

    return navItems.filter((item) => canAccessMenu(profile.role, item.key))
  }, [profile])

  async function handleLogout() {
    try {
      await signOutUser()
    } catch (error) {
      console.error(error)
    } finally {
      router.replace('/login')
    }
  }

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <CompanyLogo />
          <div className="sidebar-brand-text">
            <h1>HD Transport</h1>
            <p>Management System</p>
          </div>
        </div>

        <nav className="nav-group">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${activeMenu === item.key ? 'active' : ''}`}
            >
              <strong>{item.icon}</strong>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-title">
            <h2>{title}</h2>
            <p>{subtitle || 'Internal transport management system'}</p>
          </div>

          <div className="topbar-right">
            <div className="user-chip">
              {profile
                ? `${profile.fullName || profile.email} • ${getRoleLabel(profile.role)}`
                : 'Loading user...'}
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  )
}
