'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '@/components/auth/auth-guard'
import AppShell from '@/components/layout/app-shell'
import AccountingBookingsTab from '@/components/accounting/accounting-bookings-tab'
import AccountingPartnerCompaniesTab from '@/components/accounting/accounting-partner-companies-tab'
import AccountingReportsTab from '@/components/accounting/accounting-reports-tab'

type AccountingTab = 'bookings' | 'partner-companies' | 'reports'

type AccountingBookingItem = {
  id: string
  booking_code: string
  group_name: string
  vehicle_type: string
  start_date: string
  end_date: string
  unit_price: number
  total_km: number
  total_extra: number
  total_amount: number
  created_at: string
  assignment_status: string
  quotation_pdf_path: string | null
}

type ChartBarItem = {
  label: string
  value: number
}

type AccountingOverviewResponse = {
  bookings: AccountingBookingItem[]
  charts: {
    bookingsOverTime: ChartBarItem[]
    revenueOverTime: ChartBarItem[]
    bookingStatus: ChartBarItem[]
    assignmentCoverage: {
      vehicleAssigned: number
      vehicleUnassigned: number
      driverAssigned: number
      driverUnassigned: number
    }
    vehicleUtilization: ChartBarItem[]
    driverUtilization: ChartBarItem[]
  }
}

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<AccountingTab>('bookings')
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState('')
  const [data, setData] = useState<AccountingOverviewResponse>({
    bookings: [],
    charts: {
      bookingsOverTime: [],
      revenueOverTime: [],
      bookingStatus: [],
      assignmentCoverage: {
        vehicleAssigned: 0,
        vehicleUnassigned: 0,
        driverAssigned: 0,
        driverUnassigned: 0,
      },
      vehicleUtilization: [],
      driverUtilization: [],
    },
  })

  useEffect(() => {
    let mounted = true

    async function loadAccountingData() {
      try {
        setLoading(true)
        setErrorText('')

        const res = await fetch('/api/accounting/overview', {
          cache: 'no-store',
        })
        const json = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(json?.error || 'Không thể tải dữ liệu kế toán')
        }

        if (!mounted) return

        setData({
          bookings: Array.isArray(json?.bookings) ? json.bookings : [],
          charts: {
            bookingsOverTime: Array.isArray(json?.charts?.bookingsOverTime)
              ? json.charts.bookingsOverTime
              : [],
            revenueOverTime: Array.isArray(json?.charts?.revenueOverTime)
              ? json.charts.revenueOverTime
              : [],
            bookingStatus: Array.isArray(json?.charts?.bookingStatus)
              ? json.charts.bookingStatus
              : [],
            assignmentCoverage: {
              vehicleAssigned: Number(
                json?.charts?.assignmentCoverage?.vehicleAssigned || 0,
              ),
              vehicleUnassigned: Number(
                json?.charts?.assignmentCoverage?.vehicleUnassigned || 0,
              ),
              driverAssigned: Number(
                json?.charts?.assignmentCoverage?.driverAssigned || 0,
              ),
              driverUnassigned: Number(
                json?.charts?.assignmentCoverage?.driverUnassigned || 0,
              ),
            },
            vehicleUtilization: Array.isArray(json?.charts?.vehicleUtilization)
              ? json.charts.vehicleUtilization
              : [],
            driverUtilization: Array.isArray(json?.charts?.driverUtilization)
              ? json.charts.driverUtilization
              : [],
          },
        })
      } catch (error) {
        console.error(error)

        if (!mounted) return

        setErrorText(
          error instanceof Error ? error.message : 'Không thể tải dữ liệu kế toán',
        )
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadAccountingData()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <AuthGuard allowedRoles={['admin', 'director', 'accounting']}>
      <AppShell
        title="Kế toán"
        subtitle="Danh sách booking tài chính, danh mục công ty đối tác và báo cáo vận hành - doanh thu"
        activeMenu="accounting"
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
              background: activeTab === 'partner-companies' ? '#dbeafe' : undefined,
              borderColor: activeTab === 'partner-companies' ? '#93c5fd' : undefined,
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

        {errorText && (
          <div
            className="section-card"
            style={{
              marginBottom: 16,
              color: '#b91c1c',
              border: '1px solid #fecaca',
              background: '#fef2f2',
            }}
          >
            {errorText}
          </div>
        )}

        {activeTab === 'bookings' && (
          <AccountingBookingsTab bookings={data.bookings} loading={loading} />
        )}

        {activeTab === 'partner-companies' && (
          <AccountingPartnerCompaniesTab />
        )}

        {activeTab === 'reports' && <AccountingReportsTab />}
      </AppShell>
    </AuthGuard>
  )
}