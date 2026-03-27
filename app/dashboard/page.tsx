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
    items.push({
      href: '/resources',
      title: 'Resources',
      description: 'Quản lý xe, lái xe, import/export CSV và master data.',
      icon: '🧰',
      accent: 'linear-gradient(135deg, #fffaf5 0%, #fff3e5 100%)',
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
  const companyEmailAlt =
    companyInfo.emailAlt || companyInfo.email_alt || 'sale.hdtransport@gmail.com'
  const companyAddress =
    companyInfo.address ||
    'Số 2, ngách 168/80/18, đường Phan Trọng Tuệ, xã Đại Thanh, TP. Hà Nội'
  const companyWebsite = companyInfo.website || 'www.hdtransport.vn'
  const transportLicense =
    companyInfo.transportLicense || companyInfo.transport_license || '887/GPKDVT'
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
              borderRadius: 28,
              padding: '36px 28px',
              background: 'linear-gradient(180deg, #fbfdff 0%, #f4f8fc 100%)',
              border: '1px solid #e2e8f0',
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gap: 14,
                justifyItems: 'center',
                textAlign: 'center',
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: 32,
                  lineHeight: 1.15,
                  fontWeight: 800,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                }}
                title="Trung tâm điều hướng hiện đại cho vận hành, điều độ và dữ liệu doanh nghiệp"
              >
                Trung tâm điều hướng hiện đại cho vận hành, điều độ và dữ liệu doanh nghiệp
              </h1>

              <p
                style={{
                  margin: 0,
                  maxWidth: 860,
                  color: '#64748b',
                  fontSize: 15,
                  lineHeight: 1.75,
                  fontWeight: 400,
                }}
              >
                Dashboard chỉ giữ vai trò overview: hiển thị thương hiệu H&amp;D,
                điều hướng nhanh tới từng module và tóm tắt hồ sơ doanh nghiệp để dùng
                nhất quán cho nội bộ, báo giá và điều hành.
              </p>
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
                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    lineHeight: 1.4,
                    fontWeight: 600,
                    color: '#1e293b',
                  }}
                >
                  Đi tới đúng module chỉ trong một lần click
                </h2>
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
                      display: 'grid',
                      gap: 12,
                      textDecoration: 'none',
                      padding: 18,
                      minHeight: 156,
                      borderRadius: 20,
                      border: '1px solid #e5e7eb',
                      background: item.accent,
                      color: '#0f172a',
                      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        display: 'grid',
                        placeItems: 'center',
                        background: 'rgba(255,255,255,0.72)',
                        border: '1px solid rgba(226,232,240,0.9)',
                        fontSize: 22,
                      }}
                    >
                      {item.icon}
                    </div>

                    <div style={{ display: 'grid', gap: 6 }}>
                      <div
                        style={{
                          fontSize: 16,
                          lineHeight: 1.35,
                          fontWeight: 600,
                          color: '#0f172a',
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          lineHeight: 1.65,
                          color: '#475569',
                          fontWeight: 400,
                        }}
                      >
                        {item.description}
                      </div>
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
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    lineHeight: 1.4,
                    fontWeight: 600,
                    color: '#1e293b',
                  }}
                >
                  Gợi ý vận hành ngắn gọn cho đội ngũ nội bộ
                </h2>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  'Ưu tiên kiểm tra Gantt chart trước khi xác nhận điều xe cho booking mới.',
                  'Theo dõi assignment trùng xe hoặc trùng lái xe để xử lý sớm trong ngày.',
                  'Kiểm tra dữ liệu công ty dùng chung để báo giá và điều hành luôn đồng nhất.',
                ].map((item, index) => (
                  <div
                    key={`dashboard-focus-${index}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '28px 1fr',
                      gap: 12,
                      alignItems: 'start',
                      padding: '14px 14px',
                      borderRadius: 16,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        display: 'grid',
                        placeItems: 'center',
                        background: '#e8f1fb',
                        color: '#335d8a',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div
                      style={{
                        color: '#475569',
                        fontSize: 14,
                        lineHeight: 1.65,
                        fontWeight: 400,
                      }}
                    >
                      {item}
                    </div>
                  </div>
                ))}
              </div>
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
            <div style={{ marginBottom: 18 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  lineHeight: 1.4,
                  fontWeight: 600,
                  color: '#1e293b',
                }}
              >
                Hồ sơ doanh nghiệp dùng chung cho nội bộ, báo giá và điều hành
              </h2>
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
                    display: 'grid',
                    gridTemplateColumns: '42px 1fr',
                    gap: 12,
                    alignItems: 'start',
                    padding: 16,
                    borderRadius: 18,
                    background: '#fbfcfe',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      display: 'grid',
                      placeItems: 'center',
                      background: '#f1f5f9',
                      fontSize: 18,
                    }}
                  >
                    {item.icon}
                  </div>

                  <div style={{ display: 'grid', gap: 4 }}>
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: '#64748b',
                        fontWeight: 500,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        lineHeight: 1.65,
                        color: '#0f172a',
                        fontWeight: 500,
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
