export type UserRole =
  | 'admin'
  | 'manager'
  | 'sales'
  | 'operator'
  | 'accountant'

export type DatabaseProfile = {
  id: string
  email: string | null
  full_name: string | null
  role: string
  is_active: boolean
}

export type SessionProfile = {
  id: string
  email: string
  fullName: string
  role: UserRole
  isActive: boolean
}

export type AppMenuKey =
  | 'dashboard'
  | 'bookings'
  | 'dispatch'
  | 'accounting'
  | 'users'
  | 'settings'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  sales: 'Sales',
  operator: 'Operator',
  accountant: 'Accountant',
}

const MENU_ACCESS: Record<AppMenuKey, UserRole[]> = {
  dashboard: ['admin', 'manager', 'sales', 'operator', 'accountant'],

  bookings: ['admin', 'manager', 'sales', 'operator'],

  dispatch: ['admin', 'manager', 'sales', 'operator'],

  accounting: ['admin', 'manager', 'accountant'],

  users: ['admin'],

  settings: ['admin'],
}

export function isUserRole(value: string): value is UserRole {
  return ['admin', 'manager', 'sales', 'operator', 'accountant'].includes(value)
}

export function getRoleLabel(role: UserRole) {
  return ROLE_LABELS[role]
}

export function canAccessMenu(role: UserRole, menu: AppMenuKey) {
  return MENU_ACCESS[menu].includes(role)
}

export function canAccessPath(role: UserRole, path: string) {
  if (path === '/' || path === '/dashboard') return true

  if (path.startsWith('/bookings/new')) {
    return canAccessMenu(role, 'bookings')
  }

  if (path.startsWith('/dispatch')) {
    return canAccessMenu(role, 'dispatch')
  }

  if (path.startsWith('/accounting')) {
    return canAccessMenu(role, 'accounting')
  }

  // NEW MODULES
  if (path.startsWith('/resources')) {
    return ['admin', 'manager', 'operator'].includes(role)
  }

  if (path.startsWith('/services')) {
    return ['admin', 'manager', 'sales', 'operator'].includes(role)
  }

  if (path.startsWith('/users')) {
    return canAccessMenu(role, 'users')
  }

  if (path.startsWith('/settings')) {
    return canAccessMenu(role, 'settings')
  }

  return false
}

export function getDefaultRouteByRole(role: UserRole) {
  if (role === 'accountant') return '/accounting'
  if (role === 'operator') return '/dispatch'
  if (role === 'sales') return '/bookings/new'
  return '/dashboard'
}