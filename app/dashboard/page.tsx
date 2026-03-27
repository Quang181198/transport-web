'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '@/components/auth/auth-guard'
import AppShell from '@/components/layout/app-shell'
import { getCurrentSessionProfile } from '@/lib/auth/session'
import type { SessionProfile } from '@/lib/types/auth'
import { canAccessMenu } from '@/lib/types/auth'
import * as companyInfoModule from '@/lib/pdf/company-info'

function resolveCompanyInfo() {
  const raw =
    (companyInfoModule as { default?: unknown }).default ??
    (companyInfoModule as { companyInfo?: unknown }).companyInfo ??
    (companyInfoModule as { COMPANY_INFO?: unknown }).COMPANY_INFO ??
    {}

  return raw as Record<string, string | undefined>
}

type QuickAction = {
  href: string
  title: string
  description: string
  icon: string
  accent: string
}

type CompanyFact = {
  label: string
  value: string
  icon: string
}

function buildQuickActions(profile: SessionProfile | null): QuickAction[] {
  const items: QuickAction[] = []

  if (profile && canAccessMenu(profile.role, 'bookings')) {
    items.push({
      href: '/bookings/new',
      title: 'New Booking',
      description: 'Tạo booking mới, nhập lịch trình và lưu assignment draft.',
      icon: '📝',
      accent: 'linear-gradient(135deg, #f8fbff 0%, #edf5ff 100%)',
    })
  }

  if (profile && canAccessMenu(profile.role, 'dispatch')) {
    items.push({
      href: '/dispatch',
      title: 'Dispatch',
      description: 'Điều độ vận hành bằng Gantt chart và booking list.',
      icon: '🚐',
      accent: 'linear-gradient(135deg, #f7fcfa 0%, #edf8f3 100%)',
    })
    items.push({
      href: '/resources',
      title: 'Resources',
      description: 'Quản lý xe, lái xe, import/export CSV và master data.',
      icon: '🧰',
      accent: 'linear-gradient(135deg, #fffaf4 0%, #fff2e2 100%)',
    })
  }

  if (profile && canAccessMenu(profile.role, 'accounting')) {
    items.push({
      href: '/accounting',
      title: 'Accounting',
      description: 'Theo dõi tài chính, báo cáo và dữ liệu đối tác.',
      icon: '📊',
      accent: 'linear-gradient(135deg, #fbfaff 0%, #f4efff 100%)',
    })
  }

  return items
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<SessionProfile | null>(null)

  const companyInfo = useMemo(() => resolveCompanyInfo(), [])

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

  const companyName =
    companyInfo.companyName ||
    companyInfo.name ||
    companyInfo.legalName ||
    'CÔNG TY TNHH THƯƠNG MẠI VÀ VẬN TẢI DU LỊCH H&D'

  const companyTaxCode = companyInfo.taxCode || companyInfo.tax_code || '0105819117'
  const companyPhone = companyInfo.phone || companyInfo.hotline || '03 83 58 66 86'
  const companyHotline = companyInfo.customerHotline || companyInfo.hotlineCskh || '0915.915.264'
  const companyEmail = companyInfo.email || 'hdtransportravel@gmail.com'
  const companyEmailAlt = companyInfo.emailAlt || companyInfo.email_alt || 'sale.hdtransport@gmail.com'
  const companyAddress =
    companyInfo.address ||
    'Số 2, ngách 168/80/18, đường Phan Trọng Tuệ, xã Đại Thanh, TP. Hà Nội'
  const companyWebsite = companyInfo.website || 'www.hdtransport.vn'
  const transportLicense = companyInfo.transportLicense || companyInfo.transport_license || '887/GPKDVT'
  const internationalLicense =
    companyInfo.internationalLicense || companyInfo.international_license || '179/GPQT'

  const quickActions = useMemo(() => buildQuickActions(profile), [profile])

  const companyFacts: CompanyFact[] = [
    { label: 'Tên pháp lý', value: companyName, icon: '🏢' },
    { label: 'Mã số thuế', value: companyTaxCode, icon: '🧾' },
    { label: 'Điện thoại', value: companyPhone, icon: '☎️' },
    { label: 'Hotline CSKH', value: companyHotline, icon: '📞' },
    { label: 'Email', value: companyEmail, icon: '✉️' },
    { label: 'Email sales', value: companyEmailAlt, icon: '📨' },
    { label: 'Địa chỉ', value: companyAddress, icon: '📍' },
    { label: 'Website', value: companyWebsite, icon: '🌐' },
    { label: 'GPKD vận tải', value: transportLicense, icon: '✅' },
    { label: 'Giấy phép liên vận', value: internationalLicense, icon: '🛂' },
  ]

  return (
    <AuthGuard>
      <AppShell
        title="Dashboard"
        subtitle="Tổng quan thương hiệu, điều hướng nhanh và hồ sơ doanh nghiệp"
        activeMenu="dashboard"
      >
        <div style={{ display: 'grid', gap: 20 }}>
          <section
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 28,
              padding: 28,
              background: 'linear-gradient(135deg, #f8fbff 0%, #eef4ff 54%, #f5f7fb 100%)',
              border: '1px solid #dbe7f5',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.06)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 24%), radial-gradient(circle at bottom left, rgba(14,165,233,0.08), transparent 24%)',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                position: 'relative',
                display: 'grid',
                gap: 18,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  width: 'fit-content',
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: '1px solid #d9e6f5',
                  background: 'rgba(255,255,255,0.72)',
                  color: '#31506f',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span>H&amp;D Brand Overview</span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>Internal Navigation Console</span>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 34,
                    lineHeight: 1.2,
                    fontWeight: 800,
                    maxWidth: 860,
                    color: '#14263d',
                    textWrap: 'balance',
                  }}
                >
                  Trung tâm điều hướng hiện đại cho vận hành, điều độ và dữ liệu doanh nghiệp.
                </h3>

                <div
                  style={{
                    margin: 0,
                    maxWidth: 880,
                    color: '#4b647d',
                    fontSize: 15,
                    lineHeight: 1.8,
                  }}
                >
                  Dashboard chỉ giữ vai trò overview: hiển thị thương hiệu H&amp;D,
                  điều hướng nhanh tới từng module và tóm tắt hồ sơ doanh nghiệp để dùng
                  nhất quán cho nội bộ, báo giá và điều hành.
                </div>
              </div>
            </div>
          </section>

          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 0.75fr)',
              gap: 20,
              alignItems: 'start',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 24,
                padding: 22,
                boxShadow: '0 16px 40px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, letterSpacing: 0.6 }}>
                  QUICK ACCESS
                </div>
                <h3 style={{ margin: '8px 0 0', fontSize: 24, color: '#0f172a' }}>
                  Đi tới đúng module chỉ trong một lần click
                </h3>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 14,
                }}
              >
                {quickActions.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      textDecoration: 'none',
                      color: '#0f172a',
                      borderRadius: 22,
                      padding: 18,
                      background: item.accent,
                      border: '1px solid rgba(148, 163, 184, 0.18)',
                      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)',
                      display: 'grid',
                      gap: 10,
                      minHeight: 150,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        display: 'grid',
                        placeItems: 'center',
                        background: 'rgba(255,255,255,0.82)',
                        fontSize: 22,
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.72)',
                      }}
                    >
                      {item.icon}
                    </div>

                    <div style={{ fontSize: 18, fontWeight: 800 }}>{item.title}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.65, color: '#334155' }}>
                      {item.description}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 24,
                padding: 22,
                boxShadow: '0 16px 40px rgba(15, 23, 42, 0.05)',
                display: 'grid',
                gap: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, letterSpacing: 0.6 }}>
                  TODAY FOCUS
                </div>
                <h3 style={{ margin: '8px 0 0', fontSize: 24, color: '#0f172a' }}>
                  Gợi ý kiểm tra nhanh trước khi vào vận hành
                </h3>
              </div>

              {[
                'Kiểm tra booking mới cần điều độ sang Gantt chart.',
                'Đối chiếu lại xe và lái xe đang active trong module Resources.',
                'Xác nhận các đơn partner đã đầy đủ thông tin đối tác và PDF.',
                'Theo dõi báo cáo tài chính và doanh thu trong module Accounting.',
              ].map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 1fr',
                    gap: 12,
                    alignItems: 'start',
                    padding: '14px 0',
                    borderTop: index === 0 ? 'none' : '1px solid #eef2f7',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      display: 'grid',
                      placeItems: 'center',
                      background: '#eef4ff',
                      color: '#315dba',
                      fontWeight: 800,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ color: '#334155', lineHeight: 1.7 }}>{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 24,
              padding: 22,
              boxShadow: '0 16px 40px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, letterSpacing: 0.6 }}>
                COMPANY PROFILE
              </div>
              <h3 style={{ margin: '8px 0 0', fontSize: 24, color: '#0f172a' }}>
                Hồ sơ doanh nghiệp dùng chung cho dashboard và PDF
              </h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 14,
              }}
            >
              {companyFacts.map((item) => (
                <div
                  key={item.label}
                  style={{
                    borderRadius: 20,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    padding: 18,
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr',
                    gap: 12,
                    alignItems: 'start',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      background: '#eef4ff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 18,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{item.label}</div>
                    <div
                      style={{
                        color: '#0f172a',
                        fontWeight: 700,
                        lineHeight: 1.6,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  )
}
