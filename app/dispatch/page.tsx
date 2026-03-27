'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '@/components/auth/auth-guard'
import AppShell from '@/components/layout/app-shell'
import DispatchGantt from '@/components/dispatch/dispatch-gantt'
import DispatchBookingsTab from '@/components/dispatch/dispatch-bookings-tab'
import { getCurrentSessionProfile } from '@/lib/auth/session'
import type { SessionProfile } from '@/lib/types/auth'

type DispatchTab = 'gantt' | 'bookings'

export default function DispatchPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [profile, setProfile] = useState<SessionProfile | null>(null)
  const [activeTab, setActiveTab] = useState<DispatchTab>('gantt')

  useEffect(() => {
    let mounted = true

    async function loadProfile() {
      try {
        const nextProfile = await getCurrentSessionProfile()
        if (!mounted) return

        setProfile(nextProfile)

        if (nextProfile?.role === 'sales') {
          setActiveTab('bookings')
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

  function openGanttMonth(nextMonth: string) {
    setMonth(nextMonth)

    if (profile?.role !== 'sales') {
      setActiveTab('gantt')
    }
  }

  const canViewGantt =
    profile?.role === 'admin' ||
    profile?.role === 'manager' ||
    profile?.role === 'operator'

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'sales', 'operator']}>
      <AppShell
        title="Dispatch"
        subtitle="Gantt chart & booking operations"
        activeMenu="dispatch"
      >
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 20,
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          {canViewGantt && (
            <button
              type="button"
              onClick={() => setActiveTab('gantt')}
              className="btn btn-secondary"
              style={{
                background: activeTab === 'gantt' ? '#dbeafe' : undefined,
                borderColor: activeTab === 'gantt' ? '#93c5fd' : undefined,
              }}
            >
              Gantt chart
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className="btn btn-secondary"
            style={{
              background: activeTab === 'bookings' ? '#dbeafe' : undefined,
              borderColor: activeTab === 'bookings' ? '#93c5fd' : undefined,
            }}
          >
            Booking list
          </button>
        </div>

        {canViewGantt && activeTab === 'gantt' && (
          <>
            <div className="mb-4">
              <label>Month:</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="ml-2 border px-2 py-1"
              />
            </div>

            <DispatchGantt month={month} />
          </>
        )}

        {activeTab === 'bookings' && (
          <DispatchBookingsTab
            month={month}
            onOpenGanttMonth={openGanttMonth}
          />
        )}
      </AppShell>
    </AuthGuard>
  )
}