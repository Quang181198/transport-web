import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type AssignmentRow = {
  id: string
  booking_code: string
  group_name: string | null
  start_date: string
  end_date: string
  start_datetime: string | null
  vehicle_type: string | null
  vehicle_id: string | null
  driver_id: string | null
  vehicle_assigned: string | null
  driver_assigned: string | null
  status: string
}

type BookingRow = {
  id: string
  booking_code: string
  group_name: string | null
  start_date: string
  end_date: string
  total_amount: number | null
  booking_source: string | null
  created_at: string
}

export async function GET() {
  try {
    const supabase = createClient()

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const monthStart = `${year}-${month}-01`

    // Last day of current month
    const monthEndDate = new Date(year, now.getMonth() + 1, 0)
    const monthEnd = monthEndDate.toISOString().slice(0, 10)

    // 7 days from today
    const sevenDaysLater = new Date(now)
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
    const todayStr = now.toISOString().slice(0, 10)
    const sevenDaysStr = sevenDaysLater.toISOString().slice(0, 10)

    // ── 1. Bookings this month ─────────────────────────────
    const { data: bookingsThisMonth, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, total_amount, created_at')
      .gte('created_at', `${monthStart}T00:00:00`)
      .lte('created_at', `${monthEnd}T23:59:59`)

    if (bookingsError) throw new Error(bookingsError.message)

    const totalBookingsThisMonth = bookingsThisMonth?.length ?? 0
    const revenueThisMonth = (bookingsThisMonth ?? []).reduce(
      (sum, b) => sum + Number(b.total_amount ?? 0),
      0,
    )

    // ── 2. Active assignments (in_progress) ───────────────
    const { data: activeAssignments, error: activeError } = await supabase
      .from('assignments')
      .select('id')
      .eq('status', 'in_progress')

    if (activeError) throw new Error(activeError.message)

    // ── 3. Upcoming bookings (next 7 days) ────────────────
    const { data: upcomingRaw, error: upcomingError } = await supabase
      .from('assignments')
      .select(
        'id, booking_code, group_name, start_date, end_date, vehicle_type, vehicle_assigned, driver_assigned, status',
      )
      .gte('start_date', todayStr)
      .lte('start_date', sevenDaysStr)
      .in('status', ['pending', 'confirmed', 'assigned'])
      .order('start_date', { ascending: true })
      .limit(8)

    if (upcomingError) throw new Error(upcomingError.message)

    // ── 4. Conflict alerts — double-booked vehicles ────────
    const { data: allActiveAssignments, error: conflictError } = await supabase
      .from('assignments')
      .select(
        'id, booking_code, start_date, end_date, start_datetime, vehicle_id, driver_id, vehicle_assigned, driver_assigned, status',
      )
      .in('status', ['confirmed', 'assigned', 'in_progress'])
      .not('start_date', 'is', null)

    if (conflictError) throw new Error(conflictError.message)

    const vehicleConflicts = findConflicts(
      (allActiveAssignments as AssignmentRow[]) ?? [],
      'vehicle_id',
    )
    const driverConflicts = findConflicts(
      (allActiveAssignments as AssignmentRow[]) ?? [],
      'driver_id',
    )

    return NextResponse.json({
      kpi: {
        totalBookingsThisMonth,
        revenueThisMonth,
        activeAssignments: activeAssignments?.length ?? 0,
        upcomingCount: upcomingRaw?.length ?? 0,
      },
      upcomingAssignments: upcomingRaw ?? [],
      conflicts: {
        vehicleConflicts,
        driverConflicts,
        hasConflicts: vehicleConflicts.length > 0 || driverConflicts.length > 0,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}

/**
 * Find assignments that overlap in date range for the same resource (vehicle or driver).
 * Returns pairs of conflicting booking codes.
 */
function findConflicts(
  assignments: AssignmentRow[],
  key: 'vehicle_id' | 'driver_id',
): Array<{ resource: string; bookings: string[] }> {
  const byResource = new Map<string, AssignmentRow[]>()

  for (const a of assignments) {
    const resourceId = a[key]
    if (!resourceId) continue
    if (!byResource.has(resourceId)) byResource.set(resourceId, [])
    byResource.get(resourceId)!.push(a)
  }

  const conflicts: Array<{ resource: string; bookings: string[] }> = []

  for (const [resource, rows] of byResource.entries()) {
    if (rows.length < 2) continue

    // Check each pair for date overlap
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const a = rows[i]
        const b = rows[j]

        const aStart = a.start_date
        const aEnd = a.end_date
        const bStart = b.start_date
        const bEnd = b.end_date

        // Overlap: a starts before b ends AND b starts before a ends
        if (aStart <= bEnd && bStart <= aEnd) {
          conflicts.push({
            resource:
              key === 'vehicle_id'
                ? (a.vehicle_assigned ?? resource)
                : (a.driver_assigned ?? resource),
            bookings: [a.booking_code, b.booking_code],
          })
        }
      }
    }
  }

  return conflicts
}
