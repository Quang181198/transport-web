import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type BookingRow = {
  id: string
  booking_code: string | null
  group_name: string | null
  vehicle_type: string | null
  start_date: string | null
  end_date: string | null
  unit_price: number | null
  total_km: number | null
  total_extra: number | null
  total_amount: number | null
  created_at: string | null
  booking_source: 'direct' | 'partner' | null
  partner_company_id: string | null
}

type AssignmentRow = {
  id: string
  booking_id: string | null
  booking_code: string | null
  status: string | null
  vehicle_id: string | null
  driver_id: string | null
  vehicle_assigned: string | null
  driver_assigned: string | null
  quotation_pdf_path: string | null
}

type VehicleRow = {
  id: string
  plate_number: string | null
  vehicle_name: string | null
}

type DriverRow = {
  id: string
  full_name: string | null
}

type PartnerCompanyRow = {
  id: string
  company_name: string | null
}

function incrementMap(map: Map<string, number>, key: string, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount)
}

function sortEntries(map: Map<string, number>) {
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }))
}

function isValidYear(year: string) {
  return /^\d{4}$/.test(year)
}

function isValidMonth(month: string) {
  return /^(0[1-9]|1[0-2])$/.test(month)
}

function buildVehicleLabel(vehicle: {
  plate_number?: string | null
  vehicle_name?: string | null
}) {
  const plate = (vehicle.plate_number || '').trim()
  const name = (vehicle.vehicle_name || '').trim()

  if (plate && name) return `${plate} - ${name}`
  if (plate) return plate
  if (name) return name
  return ''
}

function normalizeStatus(status?: string | null) {
  switch ((status || 'pending').toLowerCase()) {
    case 'confirmed':
      return 'confirmed'
    case 'assigned':
      return 'assigned'
    case 'in_progress':
      return 'in_progress'
    case 'completed':
      return 'completed'
    case 'canceled':
    case 'cancelled':
    case 'cancel':
      return 'canceled'
    case 'pending':
    default:
      return 'pending'
  }
}

function getOperationalDate(booking: BookingRow) {
  return booking.start_date || booking.end_date || (booking.created_at || '').slice(0, 10) || ''
}

function getOperationalMonthKey(booking: BookingRow) {
  const date = getOperationalDate(booking)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.slice(0, 7) : 'Unknown'
}

function getOperationalDayKey(booking: BookingRow) {
  const date = getOperationalDate(booking)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : 'Unknown'
}

function isBookingInYear(booking: BookingRow, year: string) {
  const date = getOperationalDate(booking)
  return date.startsWith(`${year}-`)
}

function isBookingInMonth(booking: BookingRow, year: string, month: string) {
  const date = getOperationalDate(booking)
  return date.startsWith(`${year}-${month}-`)
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year') || String(new Date().getFullYear())
    const month = searchParams.get('month') || 'all'

    if (!isValidYear(year)) {
      return NextResponse.json({ error: 'Year không hợp lệ' }, { status: 400 })
    }

    if (month !== 'all' && !isValidMonth(month)) {
      return NextResponse.json({ error: 'Month không hợp lệ' }, { status: 400 })
    }

    const supabase = createClient()

    const queryStart = `${year}-01-01`
    const queryEnd = `${Number(year) + 1}-01-31`

    const [
      { data: bookings, error: bookingsError },
      { data: assignments, error: assignmentsError },
      { data: vehicles, error: vehiclesError },
      { data: drivers, error: driversError },
    ] = await Promise.all([
      supabase
        .from('bookings')
        .select(
          'id, booking_code, group_name, vehicle_type, start_date, end_date, unit_price, total_km, total_extra, total_amount, created_at, booking_source, partner_company_id',
        )
        .or(
          [
            `start_date.gte.${queryStart},start_date.lt.${queryEnd}`,
            `end_date.gte.${queryStart},end_date.lt.${queryEnd}`,
            `created_at.gte.${year}-01-01T00:00:00,created_at.lt.${Number(year) + 1}-01-01T00:00:00`,
          ].join(','),
        )
        .order('start_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('assignments')
        .select(
          'id, booking_id, booking_code, status, vehicle_id, driver_id, vehicle_assigned, driver_assigned, quotation_pdf_path',
        ),
      supabase.from('vehicles').select('id, plate_number, vehicle_name'),
      supabase.from('drivers').select('id, full_name'),
    ])

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message }, { status: 500 })
    }

    if (assignmentsError) {
      return NextResponse.json({ error: assignmentsError.message }, { status: 500 })
    }

    if (vehiclesError) {
      return NextResponse.json({ error: vehiclesError.message }, { status: 500 })
    }

    if (driversError) {
      return NextResponse.json({ error: driversError.message }, { status: 500 })
    }

    const bookingRows = ((bookings ?? []) as BookingRow[]).filter((item) =>
      isBookingInYear(item, year),
    )
    const assignmentRows = (assignments ?? []) as AssignmentRow[]
    const vehicleRows = (vehicles ?? []) as VehicleRow[]
    const driverRows = (drivers ?? []) as DriverRow[]

    const partnerCompanyIds = Array.from(
      new Set(
        bookingRows
          .map((item) => item.partner_company_id)
          .filter((value): value is string => Boolean(value)),
      ),
    )

    let partnerCompanyRows: PartnerCompanyRow[] = []

    if (partnerCompanyIds.length > 0) {
      const { data: partners, error: partnersError } = await supabase
        .from('partner_companies')
        .select('id, company_name')
        .in('id', partnerCompanyIds)

      if (partnersError) {
        return NextResponse.json({ error: partnersError.message }, { status: 500 })
      }

      partnerCompanyRows = (partners ?? []) as PartnerCompanyRow[]
    }

    const partnerCompanyNameMap = new Map<string, string>()
    partnerCompanyRows.forEach((item) => {
      if (!item.id) return
      partnerCompanyNameMap.set(item.id, item.company_name || '')
    })

    const bookingIdsInYear = new Set(bookingRows.map((item) => item.id))

    const assignmentsInYear = assignmentRows.filter((item) =>
      item.booking_id ? bookingIdsInYear.has(item.booking_id) : false,
    )

    const filteredBookings =
      month === 'all'
        ? bookingRows
        : bookingRows.filter((item) => isBookingInMonth(item, year, month))

    const filteredBookingIds = new Set(filteredBookings.map((item) => item.id))

    const filteredAssignments = assignmentsInYear.filter((item) =>
      item.booking_id ? filteredBookingIds.has(item.booking_id) : false,
    )

    const assignmentByBookingId = new Map<string, AssignmentRow>()
    filteredAssignments.forEach((item) => {
      if (item.booking_id) {
        assignmentByBookingId.set(item.booking_id, item)
      }
    })

    const bookingKmMap = new Map<string, number>()
    const bookingAmountMap = new Map<string, number>()

    filteredBookings.forEach((booking) => {
      bookingKmMap.set(booking.id, Number(booking.total_km || 0))
      bookingAmountMap.set(booking.id, Number(booking.total_amount || 0))
    })

    const financialBookings = filteredBookings.map((booking) => {
      const assignment = assignmentByBookingId.get(booking.id)

      return {
        id: booking.id,
        booking_code: booking.booking_code || '',
        group_name: booking.group_name || '',
        vehicle_type: booking.vehicle_type || '',
        start_date: booking.start_date || '',
        end_date: booking.end_date || '',
        unit_price: Number(booking.unit_price || 0),
        total_km: Number(booking.total_km || 0),
        total_extra: Number(booking.total_extra || 0),
        total_amount: Number(booking.total_amount || 0),
        created_at: booking.created_at || '',
        assignment_status: normalizeStatus(assignment?.status),
        quotation_pdf_path: assignment?.quotation_pdf_path || null,
        booking_source: booking.booking_source || 'direct',
        partner_company_name: booking.partner_company_id
          ? partnerCompanyNameMap.get(booking.partner_company_id) || null
          : null,
      }
    })

    const bookingsOverTimeMap = new Map<string, number>()
    const revenueOverTimeMap = new Map<string, number>()
    const bookingStatusMap = new Map<string, number>()

    const bookingsForTimeline = filteredBookings

    bookingsForTimeline.forEach((booking) => {
      const label =
        month === 'all'
          ? getOperationalMonthKey(booking)
          : getOperationalDayKey(booking)

      incrementMap(bookingsOverTimeMap, label, 1)
      incrementMap(revenueOverTimeMap, label, Number(booking.total_amount || 0))
    })

    filteredAssignments.forEach((assignment) => {
      incrementMap(bookingStatusMap, normalizeStatus(assignment.status), 1)
    })

    const vehicleAssignedCount = filteredAssignments.filter((item) => Boolean(item.vehicle_id)).length
    const driverAssignedCount = filteredAssignments.filter((item) => Boolean(item.driver_id)).length
    const vehicleUnassignedCount = filteredAssignments.length - vehicleAssignedCount
    const driverUnassignedCount = filteredAssignments.length - driverAssignedCount

    const vehicleKmMap = new Map<string, number>()
    const vehicleRevenueMap = new Map<string, number>()
    const vehicleLabelMap = new Map<string, string>()

    vehicleRows.forEach((vehicle) => {
      if (!vehicle.id) return
      vehicleLabelMap.set(vehicle.id, buildVehicleLabel(vehicle) || vehicle.id)
      vehicleKmMap.set(vehicle.id, 0)
      vehicleRevenueMap.set(vehicle.id, 0)
    })

    filteredAssignments.forEach((assignment) => {
      if (!assignment.vehicle_id || !assignment.booking_id) return

      const bookingKm = bookingKmMap.get(assignment.booking_id) || 0
      const bookingAmount = bookingAmountMap.get(assignment.booking_id) || 0

      incrementMap(vehicleKmMap, assignment.vehicle_id, bookingKm)
      incrementMap(vehicleRevenueMap, assignment.vehicle_id, bookingAmount)

      if (!vehicleLabelMap.has(assignment.vehicle_id)) {
        vehicleLabelMap.set(
          assignment.vehicle_id,
          assignment.vehicle_assigned || assignment.vehicle_id,
        )
      }
    })

    const vehicleUtilization = Array.from(vehicleKmMap.entries())
      .map(([id, value]) => ({
        label: vehicleLabelMap.get(id) || id,
        value,
      }))
      .sort((a, b) => b.value - a.value)

    const vehicleRevenue = Array.from(vehicleRevenueMap.entries())
      .map(([id, value]) => ({
        label: vehicleLabelMap.get(id) || id,
        value,
      }))
      .sort((a, b) => b.value - a.value)

    const driverKmMap = new Map<string, number>()
    const driverLabelMap = new Map<string, string>()

    driverRows.forEach((driver) => {
      if (!driver.id) return
      driverLabelMap.set(driver.id, driver.full_name || driver.id)
      driverKmMap.set(driver.id, 0)
    })

    filteredAssignments.forEach((assignment) => {
      if (!assignment.driver_id || !assignment.booking_id) return

      const bookingKm = bookingKmMap.get(assignment.booking_id) || 0
      incrementMap(driverKmMap, assignment.driver_id, bookingKm)

      if (!driverLabelMap.has(assignment.driver_id)) {
        driverLabelMap.set(
          assignment.driver_id,
          assignment.driver_assigned || assignment.driver_id,
        )
      }
    })

    const driverUtilization = Array.from(driverKmMap.entries())
      .map(([id, value]) => ({
        label: driverLabelMap.get(id) || id,
        value,
      }))
      .sort((a, b) => b.value - a.value)

    return NextResponse.json({
      filter: {
        year,
        month,
      },
      bookings: financialBookings,
      charts: {
        bookingsOverTime: sortEntries(bookingsOverTimeMap),
        revenueOverTime: sortEntries(revenueOverTimeMap),
        bookingStatus: Array.from(bookingStatusMap.entries()).map(([label, value]) => ({
          label,
          value,
        })),
        assignmentCoverage: {
          vehicleAssigned: vehicleAssignedCount,
          vehicleUnassigned: vehicleUnassignedCount,
          driverAssigned: driverAssignedCount,
          driverUnassigned: driverUnassignedCount,
        },
        vehicleUtilization,
        vehicleRevenue,
        driverUtilization,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Không thể tải dữ liệu kế toán',
      },
      { status: 500 },
    )
  }
}