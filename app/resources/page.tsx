'use client'

import AuthGuard from '@/components/auth/auth-guard'
import AppShell from '@/components/layout/app-shell'
import DispatchResourcesTab from '@/components/dispatch/dispatch-resources-tab'

export default function ResourcesPage() {
  return (
    <AuthGuard allowedRoles={['admin', 'director']}>
      <AppShell
        title="Resources"
        subtitle="Quản lý xe và lái xe"
      >
        <DispatchResourcesTab />
      </AppShell>
    </AuthGuard>
  )
}