'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '@/components/auth/auth-guard'
import AppShell from '@/components/layout/app-shell'
import { getCurrentSessionProfile } from '@/lib/auth/session'
import type { SessionProfile } from '@/lib/types/auth'
import { canAccessMenu } from '@/lib/types/auth'

// ─── Types ───────────────────────────────────────────────────

type QuickAction = {
  href: string
  title: string
  description: string
  icon: string
  accent: string
}

type UpcomingAssignment = {
  id: string
  booking_code: string
  group_name: string | null
  start_date: string
  end_date: string
  vehicle_type: string | null
  vehicle_assigned: string | null
  driver_assigned: string | null
  status: string
}

type ConflictItem = {
  resource: string
  bookings: string[]
}

type DashboardData = {
  kpi: {
    totalBookingsThisMonth: number
    revenueThisMonth: number
    activeAssignments: number
    upcomingCount: number
  }
  upcomingAssignments: UpcomingAssignment[]
  conflicts: {
    vehicleConflicts: ConflictItem[]
    driverConflicts: ConflictItem[]
    hasConflicts: boolean
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function formatCurrency(value: number) {
  return `${value.toLocaleString('vi-VN')} ₫`
}

function formatDate(dateStr: string) {
  try {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  } catch {
    return dateStr
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  assigned: 'Đã gán xe',
  in_progress: 'Đang chạy',
  completed: 'Hoàn thành',
  canceled: 'Đã hủy',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#94a3b8',
  confirmed: '#7c3aed',
  assigned: '#2563eb',
  in_progress: '#ea580c',
  completed: '#16a34a',
  canceled: '#dc2626',
}

// ─── Quick Actions builder ────────────────────────────────────

function buildQuickActions(profile: SessionProfile | null): QuickAction[] {
  const items: QuickAction[] = []

  if (profile && canAccessMenu(profile.role, 'bookings')) {
    items.push({
      href: '/bookings/new',
      title: 'New Booking',
      description: 'Tạo booking mới, nhập lịch trình và lưu assignment draft.',
      icon: '📝',
      accent: 'linear-gradient(135deg, #f8fbff 0%, #eef6ff 100%)',
    })
  }

  if (profile && canAccessMenu(profile.role, 'dispatch')) {
    items.push({
      href: '/dispatch',
      title: 'Dispatch',
      description: 'Điều độ vận hành bằng Gantt chart và booking list.',
      icon: '🚐',
      accent: 'linear-gradient(135deg, #f7fcfa 0%, #eef8f3 100%)',
    })
  }

  if (profile && ['admin', 'manager', 'operator'].includes(profile.role)) {
    items.push({
      href: '/resources',
      title: 'Resources',
      description: 'Quản lý xe, lái xe, import/export CSV và master data.',
      icon: '🧰',
      accent: 'linear-gradient(135deg, #fffaf5 0%, #fff3e5 100%)',
    })
  }

  if (
    profile &&
    ['admin', 'manager', 'sales', 'operator'].includes(profile.role)
  ) {
    items.push({
      href: '/services',
      title: 'Services',
      description: 'Quản lý gói dịch vụ và lịch trình mẫu.',
      icon: '🧭',
      accent: 'linear-gradient(135deg, #f7f7ff 0%, #eeefff 100%)',
    })
  }

  if (profile && canAccessMenu(profile.role, 'accounting')) {
    items.push({
      href: '/accounting',
      title: 'Accounting',
      description: 'Theo dõi tài chính, báo cáo và dữ liệu đối tác.',
      icon: '📊',
      accent: 'linear-gradient(135deg, #fbfaff 0%, #f4f0ff 100%)',
    })
  }

  if (profile && canAccessMenu(profile.role, 'users')) {
    items.push({
      href: '/users',
      title: 'User Management',
      description: 'Quản lý tài khoản, bảo mật phân quyền và thư mời.',
      icon: '👥',
      accent: 'linear-gradient(135deg, #fff5f5 0%, #ffeaea 100%)',
    })
  }

  return items
}

// ─── Sub-components ───────────────────────────────────────────

function KpiCard({
  label,
  value,
  subtext,
  color,
  icon,
}: {
  label: string
  value: string
  subtext?: string
  color?: string
  icon: string
}) {
  return (
    <div
      className="kpi-card"
      style={{ display: 'grid', gap: 6, position: 'relative', overflow: 'hidden' }}
    >
      <div
        style={{
          position: 'absolute',
          top: -10,
          right: -10,
          fontSize: 64,
          opacity: 0.06,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {icon}
      </div>
      <p style={{ marginBottom: 0 }}>{label}</p>
      <h3
        style={{
          marginTop: 4,
          marginBottom: 0,
          color: color ?? 'var(--text)',
          fontSize: 26,
        }}
      >
        {value}
      </h3>
      {subtext && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
          {subtext}
        </div>
      )}
    </div>
  )
}

function ConflictAlert({ conflicts }: { conflicts: DashboardData['conflicts'] }) {
  if (!conflicts.hasConflicts) return null

  const allConflicts = [
    ...conflicts.vehicleConflicts.map((c) => ({ type: 'Xe', ...c })),
    ...conflicts.driverConflicts.map((c) => ({ type: 'Tài xế', ...c })),
  ]

  return (
    <div
      style={{
        background: '#fff7ed',
        border: '1px solid #fed7aa',
        borderRadius: 14,
        padding: '14px 18px',
        display: 'grid',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 700,
          color: '#c2410c',
          fontSize: 15,
        }}
      >
        ⚠️ Phát hiện {allConflicts.length} xung đột lịch — cần xử lý trước khi xác nhận
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {allConflicts.slice(0, 5).map((c, i) => (
          <div
            key={`conflict-${i}`}
            style={{
              fontSize: 13,
              color: '#9a3412',
              paddingLeft: 8,
              borderLeft: '3px solid #fb923c',
            }}
          >
            {c.type} <strong>{c.resource}</strong> bị trùng lịch:{' '}
            {c.bookings.join(' & ')}
          </div>
        ))}
      </div>
      <Link
        href="/dispatch"
        style={{
          fontSize: 13,
          color: '#c2410c',
          fontWeight: 600,
          textDecoration: 'underline',
        }}
      >
        → Mở Dispatch để xử lý
      </Link>
    </div>
  )
}

function UpcomingTable({
  assignments,
}: {
  assignments: UpcomingAssignment[]
}) {
  if (assignments.length === 0) {
    return (
      <div className="empty-box" style={{ textAlign: 'center', padding: 28 }}>
        🗓️ Không có assignment nào trong 7 ngày tới
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Booking</th>
            <th>Nhóm khách</th>
            <th>Ngày đi</th>
            <th>Ngày về</th>
            <th>Loại xe</th>
            <th>Xe / Tài xế</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => (
            <tr key={a.id}>
              <td>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  {a.booking_code}
                </span>
              </td>
              <td>{a.group_name || '—'}</td>
              <td>{formatDate(a.start_date)}</td>
              <td>{formatDate(a.end_date)}</td>
              <td>{a.vehicle_type ? `${a.vehicle_type} chỗ` : '—'}</td>
              <td style={{ fontSize: 13 }}>
                <div>{a.vehicle_assigned || '⚠️ Chưa gán xe'}</div>
                <div style={{ color: 'var(--muted)' }}>
                  {a.driver_assigned || 'Chưa gán tài xế'}
                </div>
              </td>
              <td>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    background: `${STATUS_COLORS[a.status] ?? '#94a3b8'}18`,
                    color: STATUS_COLORS[a.status] ?? '#94a3b8',
                  }}
                >
                  {STATUS_LABELS[a.status] ?? a.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const [profile, setProfile] = useState<SessionProfile | null>(null)
  const [dashData, setDashData] = useState<DashboardData | null>(null)
  const [loadingDash, setLoadingDash] = useState(true)
  const [dashError, setDashError] = useState('')

  // Load profile
  useEffect(() => {
    let mounted = true
    async function loadProfile() {
      try {
        const nextProfile = await getCurrentSessionProfile()
        if (mounted) setProfile(nextProfile)
      } catch (error) {
        console.error(error)
      }
    }
    void loadProfile()
    return () => {
      mounted = false
    }
  }, [])

  // Load dashboard summary
  useEffect(() => {
    let mounted = true
    async function loadDash() {
      try {
        setLoadingDash(true)
        const res = await fetch('/api/dashboard/summary', { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Không tải được dashboard')
        if (mounted) setDashData(json as DashboardData)
      } catch (err) {
        if (mounted)
          setDashError(
            err instanceof Error ? err.message : 'Không tải được dashboard',
          )
      } finally {
        if (mounted) setLoadingDash(false)
      }
    }
    void loadDash()
    return () => {
      mounted = false
    }
  }, [])

  const quickActions = useMemo(() => buildQuickActions(profile), [profile])

  const now = new Date()
  const monthLabel = `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`

  return (
    <AuthGuard>
      <AppShell
        title="Dashboard"
        subtitle="Tổng quan vận hành và điều hướng nhanh"
        activeMenu="dashboard"
      >
        <div style={{ display: 'grid', gap: 20 }}>

          {/* ── KPI Row ─────────────────────────────────────── */}
          {loadingDash ? (
            <div className="card-row">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="kpi-card"
                  style={{
                    height: 100,
                    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.4s infinite',
                  }}
                />
              ))}
            </div>
          ) : dashError ? (
            <div
              className="section-card"
              style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca' }}
            >
              ⚠️ {dashError}
            </div>
          ) : (
            <div className="card-row">
              <KpiCard
                icon="📝"
                label="Booking tháng này"
                value={(dashData?.kpi.totalBookingsThisMonth ?? 0).toLocaleString('vi-VN')}
                subtext={monthLabel}
                color="var(--primary)"
              />
              <KpiCard
                icon="💰"
                label="Doanh thu tháng này"
                value={formatCurrency(dashData?.kpi.revenueThisMonth ?? 0)}
                subtext={monthLabel}
                color="var(--success)"
              />
              <KpiCard
                icon="🚐"
                label="Đang chạy"
                value={(dashData?.kpi.activeAssignments ?? 0).toLocaleString('vi-VN')}
                subtext="Assignments in_progress"
                color="#ea580c"
              />
              <KpiCard
                icon="🗓️"
                label="Sắp khởi hành (7 ngày)"
                value={(dashData?.kpi.upcomingCount ?? 0).toLocaleString('vi-VN')}
                subtext="Assignments chưa hoàn thành"
              />
            </div>
          )}

          {/* ── Conflict Alerts ──────────────────────────────── */}
          {!loadingDash && dashData?.conflicts.hasConflicts && (
            <ConflictAlert conflicts={dashData.conflicts} />
          )}

          {/* ── Quick Actions + Upcoming ─────────────────────── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 0.6fr)',
              gap: 20,
              alignItems: 'start',
            }}
          >
            {/* Upcoming assignments */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 20,
                padding: 20,
                boxShadow: '0 8px 24px rgba(15,23,42,0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
                  🗓️ Assignment sắp khởi hành (7 ngày tới)
                </h2>
                <Link
                  href="/dispatch"
                  style={{
                    fontSize: 13,
                    color: 'var(--primary)',
                    fontWeight: 600,
                  }}
                >
                  Xem tất cả →
                </Link>
              </div>
              {loadingDash ? (
                <div style={{ color: 'var(--muted)', padding: '20px 0' }}>
                  Đang tải...
                </div>
              ) : (
                <UpcomingTable
                  assignments={dashData?.upcomingAssignments ?? []}
                />
              )}
            </div>

            {/* Quick Actions */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 20,
                padding: 20,
                boxShadow: '0 8px 24px rgba(15,23,42,0.05)',
              }}
            >
              <h2
                style={{
                  margin: '0 0 14px',
                  fontSize: 17,
                  fontWeight: 600,
                  color: '#1e293b',
                }}
              >
                Truy cập nhanh
              </h2>
              <div style={{ display: 'grid', gap: 10 }}>
                {quickActions.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: '1px solid #e5e7eb',
                      background: item.accent,
                      textDecoration: 'none',
                      color: '#0f172a',
                      transition: 'box-shadow 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        display: 'grid',
                        placeItems: 'center',
                        background: 'rgba(255,255,255,0.8)',
                        border: '1px solid rgba(226,232,240,0.9)',
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#475569',
                          lineHeight: 1.4,
                          marginTop: 2,
                        }}
                      >
                        {item.description}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </AppShell>
    </AuthGuard>
  )
}