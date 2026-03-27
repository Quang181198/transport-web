'use client'

import { useState } from 'react'
import AuthGuard from '@/components/auth/auth-guard'
import AppShell from '@/components/layout/app-shell'
import DispatchGantt from '@/components/dispatch/dispatch-gantt'
import DispatchBookingsTab from '@/components/dispatch/dispatch-bookings-tab'

type DispatchTab = 'gantt' | 'bookings'

export default function DispatchPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [activeTab, setActiveTab] = useState<DispatchTab>('gantt')

  function openGanttMonth(nextMonth: string) {
    setMonth(nextMonth)
    setActiveTab('gantt')
  }

  return (
    <AuthGuard allowedRoles={['admin', 'director', 'sale']}>
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

        {activeTab === 'gantt' && (
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