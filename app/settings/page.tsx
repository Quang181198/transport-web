'use client'

import AuthGuard from '@/components/auth/auth-guard'
import AppShell from '@/components/layout/app-shell'
import CompanySettingsForm from '@/components/settings/company-settings-form'

export default function SettingsPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AppShell
        title="Settings"
        subtitle="Cấu hình thương hiệu, thông tin công ty và ứng dụng"
        activeMenu="settings"
      >
        <CompanySettingsForm />
      </AppShell>
    </AuthGuard>
  )
}
