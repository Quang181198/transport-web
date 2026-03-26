'use client'

import { useState } from 'react'
import AuthGuard from '@/components/auth/auth-guard'
import AppShell from '@/components/layout/app-shell'
import AccountingBookingsTab from '@/components/accounting/accounting-bookings-tab'
import AccountingPartnerCompaniesTab from '@/components/accounting/accounting-partner-companies-tab'
import AccountingReportsTab from '@/components/accounting/accounting-reports-tab'

type AccountingTab = 'bookings' | 'partner-companies' | 'reports'

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<AccountingTab>('bookings')

  return (
    <AuthGuard allowedRoles={['admin', 'director', 'accounting']}>
      <AppShell
        title="Kế toán"
        subtitle="Danh sách booking tài chính, danh mục công ty đối tác và báo cáo vận hành - doanh thu"
        activeMenu="accounting"
      >
        {/* TAB BUTTONS */}
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
            onClick={() => setActiveTab('bookings')}
            className="btn btn-secondary"
            style={{
              background: activeTab === 'bookings' ? '#dbeafe' : undefined,
              borderColor: activeTab === 'bookings' ? '#93c5fd' : undefined,
            }}
          >
            Danh sách booking
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('partner-companies')}
            className="btn btn-secondary"
            style={{
              background:
                activeTab === 'partner-companies' ? '#dbeafe' : undefined,
              borderColor:
                activeTab === 'partner-companies' ? '#93c5fd' : undefined,
            }}
          >
            Công ty đối tác
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className="btn btn-secondary"
            style={{
              background: activeTab === 'reports' ? '#dbeafe' : undefined,
              borderColor: activeTab === 'reports' ? '#93c5fd' : undefined,
            }}
          >
            Báo cáo chart
          </button>
        </div>

        {/* TAB CONTENT */}
        {activeTab === 'bookings' && <AccountingBookingsTab />}

        {activeTab === 'partner-companies' && (
          <AccountingPartnerCompaniesTab />
        )}

        {activeTab === 'reports' && <AccountingReportsTab />}
      </AppShell>
    </AuthGuard>
  )
}