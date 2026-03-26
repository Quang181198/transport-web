export type UserRole = 'admin' | 'director' | 'sale' | 'accounting'

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

export type AppMenuKey = 'dashboard' | 'bookings' | 'dispatch' | 'accounting'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  director: 'Director',
  sale: 'Sale',
  accounting: 'Accounting',
}

const MENU_ACCESS: Record<AppMenuKey, UserRole[]> = {
  dashboard: ['admin', 'director', 'sale', 'accounting'],
  bookings: ['admin', 'director', 'sale'],
  dispatch: ['admin', 'director', 'sale'],
  accounting: ['admin', 'director', 'accounting'],
}

export function isUserRole(value: string): value is UserRole {
  return ['admin', 'director', 'sale', 'accounting'].includes(value)
}

export function getRoleLabel(role: UserRole) {
  return ROLE_LABELS[role]
}

export function canAccessMenu(role: UserRole, menu: AppMenuKey) {
  return MENU_ACCESS[menu].includes(role)
}

export function canAccessPath(role: UserRole, path: string) {
  if (path === '/' || path === '/dashboard') return true
  if (path.startsWith('/bookings/new')) return canAccessMenu(role, 'bookings')
  if (path.startsWith('/dispatch')) return canAccessMenu(role, 'dispatch')
  if (path.startsWith('/accounting')) return canAccessMenu(role, 'accounting')
  return false
}

export function getDefaultRouteByRole(role: UserRole) {
  if (role === 'accounting') return '/accounting'
  return '/dashboard'
}