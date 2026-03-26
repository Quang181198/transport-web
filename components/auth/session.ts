'use client'

const AUTH_KEY = 'hd_transport_logged_in'

export function loginDemo() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_KEY, 'true')
  }
}

export function logoutDemo() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY)
  }
}

export function isLoggedInDemo() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(AUTH_KEY) === 'true'
}