'use client'

import AuthGuard from '@/components/auth/auth-guard'
import AppShell from '@/components/layout/app-shell'
import UsersManagementTab from '@/components/users/users-management-tab'

export default function UsersPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AppShell
        title="Users Management"
        subtitle="Quản lý tài khoản và phân quyền người dùng"
        activeMenu="users"
      >
        <UsersManagementTab />
      </AppShell>
    </AuthGuard>
  )
}
