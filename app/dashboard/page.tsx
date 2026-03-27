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

    loadProfile()

    return () => {
      mounted = false
    }
  }, [])

  const companyName =
    companyInfo.companyName ||
    companyInfo.name ||
    companyInfo.legalName ||
    'HD Transport'

  const companyTaxCode = companyInfo.taxCode || companyInfo.tax_code || ''
  const companyPhone = companyInfo.phone || companyInfo.hotline || ''
  const companyEmail = companyInfo.email || ''
  const companyAddress = companyInfo.address || ''
  const companyWebsite = companyInfo.website || ''

  return (
    <AuthGuard>
      <AppShell
        title="Dashboard"
        subtitle="Tổng quan nhanh cho quản trị và vận hành"
        activeMenu="dashboard"
      >
        <div className="grid-2">
          <div className="section-card">
            <h3 className="section-title">Điều hướng nhanh</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {profile && canAccessMenu(profile.role, 'bookings') && (
                <Link className="btn btn-secondary" href="/bookings/new">
                  Đi tới module Sales / Booking
                </Link>
              )}

              {profile && canAccessMenu(profile.role, 'dispatch') && (
                <Link className="btn btn-secondary" href="/dispatch">
                  Đi tới module Điều hành
                </Link>
              )}

              {profile && canAccessMenu(profile.role, 'accounting') && (
                <Link className="btn btn-secondary" href="/accounting">
                  Đi tới module Kế toán
                </Link>
              )}

              {profile && canAccessMenu(profile.role, 'dispatch') && (
                <Link className="btn btn-secondary" href="/resources">
                  Đi tới module Quản lý xe & lái xe
                </Link>
              )}

            </div>
          </div>

          <div className="section-card">
            <h3 className="section-title">Ghi chú</h3>
            <div className="empty-box">
              Dashboard chỉ giữ thông tin tổng quan ngắn.
              Mỗi nghiệp vụ chính đã được tách riêng sang từng module.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }} className="section-card">
          <h3 className="section-title">Thông tin công ty</h3>

          <div
            style={{
              display: 'grid',
              gap: 10,
            }}
          >
            <div>
              <strong>Tên công ty:</strong> {companyName}
            </div>

            {companyTaxCode && (
              <div>
                <strong>Mã số thuế:</strong> {companyTaxCode}
              </div>
            )}

            {companyPhone && (
              <div>
                <strong>Điện thoại:</strong> {companyPhone}
              </div>
            )}

            {companyEmail && (
              <div>
                <strong>Email:</strong> {companyEmail}
              </div>
            )}

            {companyAddress && (
              <div>
                <strong>Địa chỉ:</strong> {companyAddress}
              </div>
            )}

            {companyWebsite && (
              <div>
                <strong>Website:</strong> {companyWebsite}
              </div>
            )}

            {!companyTaxCode &&
              !companyPhone &&
              !companyEmail &&
              !companyAddress &&
              !companyWebsite && (
                <div className="empty-box">
                  Hãy kiểm tra lại dữ liệu trong <code>lib/pdf/company-info.ts</code>.
                </div>
              )}
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  )
}