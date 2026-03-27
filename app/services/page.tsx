'use client'

import AuthGuard from '@/components/auth/auth-guard'
import AppShell from '@/components/layout/app-shell'
import ServicePackagesTab from '@/components/services/service-packages-tab'

export default function ServicesPage() {
  return (
    <AuthGuard allowedRoles={['admin', 'director', 'sale']}>
      <AppShell title="Services" subtitle="Quản lý gói dịch vụ và lịch trình mẫu">
        <ServicePackagesTab />
      </AppShell>
    </AuthGuard>
  )
}
