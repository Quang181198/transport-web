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
}

type ServiceTile = {
  title: string
  description: string
  badge: string
}

type CompanyFact = {
  label: string
  value: string
  icon: string
}

const serviceTiles: ServiceTile[] = [
  {
    title: 'Thuê xe du lịch',
    description: 'Biển, Đông Tây Bắc, lân cận Hà Nội, xuyên Việt và quốc tế.',
    badge: 'Tour & tuyến',
  },
  {
    title: 'Thuê xe lễ hội',
    description: 'Du xuân, lễ hội du lịch và các lịch trình mùa vụ ngắn ngày.',
    badge: 'Seasonal',
  },
  {
    title: 'Thuê xe công tác',
    description: 'Đi tỉnh, làm việc nội thành, ngoại thành, khu công nghiệp, quay phim.',
    badge: 'Business',
  },
  {
    title: 'Thuê xe cưới hỏi',
    description: 'Xe hoa và xe đưa đón nghi lễ cho đoàn cưới, họ hàng, khách mời.',
    badge: 'Event',
  },
  {
    title: 'Hợp đồng dài hạn',
    description: 'Đưa đón công nhân, học sinh, chuyên gia và cán bộ nhân viên.',
    badge: 'Contract',
  },
  {
    title: 'Đội xe đa cấu hình',
    description: 'Các nhóm xe 4, 7, 16, 29, 35, 45 chỗ phục vụ nhiều nhu cầu khác nhau.',
    badge: 'Fleet mix',
  },
]

function buildQuickActions(profile: SessionProfile | null): QuickAction[] {
  const items: QuickAction[] = []

  if (profile && canAccessMenu(profile.role, 'bookings')) {
    items.push({
      href: '/bookings/new',
      title: 'New Booking',
      description: 'Tạo booking mới, nhập lịch trình và lưu assignment draft.',
      icon: '📝',
    })
  }

  if (profile && canAccessMenu(profile.role, 'dispatch')) {
    items.push({
      href: '/dispatch',
      title: 'Dispatch',
      description: 'Điều độ vận hành bằng Gantt chart và booking list.',
      icon: '🚐',
    })
    items.push({
      href: '/resources',
      title: 'Resources',
      description: 'Quản lý xe, lái xe, import/export CSV và master data.',
      icon: '🧰',
    })
  }

  if (profile && canAccessMenu(profile.role, 'accounting')) {
    items.push({
      href: '/accounting',
      title: 'Accounting',
      description: 'Theo dõi tài chính, báo cáo và dữ liệu đối tác.',
      icon: '📊',
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
        subtitle="Tổng quan thương hiệu, điều hướng nhanh và thông tin doanh nghiệp"
        activeMenu="dashboard"
      >
        <div
          style={{
            display: 'grid',
            gap: 20,
          }}
        >
          <section
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 28,
              padding: 28,
              background:
                'linear-gradient(135deg, #0f172a 0%, #1d4ed8 50%, #38bdf8 100%)',
              color: '#fff',
              boxShadow: '0 24px 80px rgba(15, 23, 42, 0.18)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at top right, rgba(255,255,255,0.22), transparent 28%), radial-gradient(circle at bottom left, rgba(255,255,255,0.14), transparent 24%)',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.7fr) minmax(320px, 1fr)',
                gap: 24,
              }}
            >
              <div style={{ display: 'grid', gap: 18 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    width: 'fit-content',
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(10px)',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                  }}
                >
                  <span>2026 Ops Console</span>
                  <span style={{ opacity: 0.75 }}>•</span>
                  <span>HD Transport Management System</span>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 34,
                      lineHeight: 1.15,
                      fontWeight: 800,
                      maxWidth: 760,
                    }}
                  >
                    Trung tâm điều hướng hiện đại cho vận hành, điều độ và dữ liệu doanh nghiệp.
                  </h3>

                  <div
                    style={{
                      margin: 0,
                      maxWidth: 760,
                      color: 'rgba(255,255,255,0.88)',
                      fontSize: 15,
                      lineHeight: 1.7,
                    }}
                  >
                    Dashboard chỉ giữ vai trò overview: hiển thị thương hiệu H&amp;D,
                    điều hướng nhanh sang các module chính và tổng hợp những năng lực cốt lõi
                    từ website doanh nghiệp như dịch vụ, quy mô đội xe và hồ sơ pháp lý.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {quickActions.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 16px',
                        borderRadius: 18,
                        textDecoration: 'none',
                        color: '#0f172a',
                        background: '#fff',
                        fontWeight: 700,
                        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.18)',
                      }}
                    >
                      <span>{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div
                style={{
                  alignSelf: 'stretch',
                  display: 'grid',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    borderRadius: 24,
                    padding: 20,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
                    COMPANY SNAPSHOT
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.3 }}>
                    H&amp;D Transport
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.88)',
                      lineHeight: 1.7,
                    }}
                  >
                    Dịch vụ thuê xe du lịch, công tác, cưới hỏi, lễ hội và hợp đồng dài hạn
                    với đội xe 4–45 chỗ.
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 12,
                  }}
                >
                  {[
                    { label: 'Vehicle mix', value: '4 / 7 / 16 / 29 / 35 / 45', icon: '🚘' },
                    { label: 'Hotline', value: companyHotline, icon: '📞' },
                    { label: 'Transport license', value: transportLicense, icon: '📄' },
                    { label: 'International permit', value: internationalLicense, icon: '🌍' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        borderRadius: 20,
                        padding: 16,
                        background: 'rgba(255,255,255,0.12)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                      <div style={{ fontSize: 12, opacity: 0.78 }}>{item.label}</div>
                      <div style={{ marginTop: 4, fontSize: 15, fontWeight: 800 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 16,
            }}
          >
            {[
              {
                title: 'Core modules',
                value: String(quickActions.length),
                description: 'Các module sẵn sàng theo quyền người dùng hiện tại.',
                accent: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              },
              {
                title: 'Service groups',
                value: '5+',
                description: 'Du lịch, lễ hội, công tác, cưới hỏi, hợp đồng dài hạn.',
                accent: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
              },
              {
                title: 'Fleet classes',
                value: '6',
                description: 'Nhóm xe từ 4 chỗ đến 45 chỗ theo website công ty.',
                accent: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
              },
              {
                title: 'Company profile',
                value: 'Ready',
                description: 'Thông tin doanh nghiệp sẵn sàng dùng cho dashboard và PDF.',
                accent: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="section-card"
                style={{
                  padding: 20,
                  borderRadius: 24,
                  background: card.accent,
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div style={{ color: '#475569', fontSize: 13, fontWeight: 700 }}>
                  {card.title}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 28,
                    lineHeight: 1,
                    fontWeight: 800,
                    color: '#0f172a',
                  }}
                >
                  {card.value}
                </div>
                <div style={{ marginTop: 10, color: '#475569', fontSize: 14, lineHeight: 1.7 }}>
                  {card.description}
                </div>
              </div>
            ))}
          </section>

          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.25fr) minmax(360px, 0.95fr)',
              gap: 20,
            }}
          >
            <div className="section-card" style={{ borderRadius: 24, padding: 24 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 18,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h3 className="section-title" style={{ marginBottom: 6 }}>
                    Điều hướng nhanh theo module
                  </h3>
                  <div style={{ color: '#64748b', fontSize: 14 }}>
                    Thiết kế dạng card hiện đại để truy cập module nhanh, rõ vai trò.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 16,
                }}
              >
                {quickActions.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      borderRadius: 24,
                      border: '1px solid #e2e8f0',
                      padding: 20,
                      background: '#fff',
                      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)',
                      display: 'grid',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        display: 'grid',
                        placeItems: 'center',
                        background: '#eff6ff',
                        fontSize: 22,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                      {item.title}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
                      {item.description}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        color: '#2563eb',
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Mở module →
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="section-card" style={{ borderRadius: 24, padding: 24 }}>
              <div style={{ marginBottom: 18 }}>
                <h3 className="section-title" style={{ marginBottom: 6 }}>
                  Năng lực dịch vụ từ website công ty
                </h3>
                <div style={{ color: '#64748b', fontSize: 14 }}>
                  Các nhóm dịch vụ có thể dùng làm nền cho dashboard, sales template và reporting.
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {serviceTiles.map((item) => (
                  <div
                    key={item.title}
                    style={{
                      display: 'grid',
                      gap: 6,
                      borderRadius: 18,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.title}</div>
                      <div
                        style={{
                          borderRadius: 999,
                          padding: '4px 10px',
                          background: '#e0f2fe',
                          color: '#0369a1',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {item.badge}
                      </div>
                    </div>
                    <div style={{ color: '#64748b', fontSize: 14, lineHeight: 1.65 }}>
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="section-card" style={{ borderRadius: 24, padding: 24 }}>
            <div style={{ marginBottom: 18 }}>
              <h3 className="section-title" style={{ marginBottom: 6 }}>
                Hồ sơ doanh nghiệp tích hợp từ website
              </h3>
              <div style={{ color: '#64748b', fontSize: 14 }}>
                Các thông tin này có thể tái sử dụng cho dashboard, quotation PDF, dispatch order và tài liệu nội bộ.
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 14,
              }}
            >
              {companyFacts.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px minmax(0, 1fr)',
                    gap: 14,
                    alignItems: 'start',
                    borderRadius: 20,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      display: 'grid',
                      placeItems: 'center',
                      background: '#f1f5f9',
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
                        wordBreak: 'break-word',
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
