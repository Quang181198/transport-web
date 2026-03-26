'use client'

import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/auth/auth-guard'
import AppShell from '@/components/layout/app-shell'
import BookingForm from '@/components/bookings/booking-form'

export default function NewBookingPage() {
  const router = useRouter()

  return (
    <AuthGuard allowedRoles={['admin', 'director', 'sale']}>
      <AppShell
        title="New Booking"
        subtitle="Enter group info, itinerary, and pricing"
        activeMenu="bookings"
      >
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="btn btn-secondary"
          style={{ marginBottom: 16 }}
        >
          ← Back
        </button>

        <BookingForm />
      </AppShell>
    </AuthGuard>
  )
}