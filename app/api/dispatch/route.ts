import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

type AssignmentRow = {
  id: string
  booking_id: string | null
  booking_code: string
  group_name: string
  start_date: string
  end_date: string
  start_datetime: string | null
  end_datetime: string | null
  vehicle_type: string | null
  vehicle_id: string | null
  driver_id: string | null
  vehicle_assigned: string | null
  driver_assigned: string | null
  quotation_pdf_path: string | null
  status: string | null
}

type LegRow = {
  booking_id: string
  seq_no: number
  trip_date: string | null
  pickup_time: string | null
  dropoff_time: string | null
  itinerary: string | null
  distance_km: number | null
  note: string | null
  extra_amount: number | null
}

function isValidMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
}

function normalizeTime(value?: string | null) {
  if (!value) return ''
  return String(value).slice(0, 8)
}

function buildDateTime(date: string | null | undefined, time: string | null | undefined, isEnd: boolean) {
  if (!date) return null
  const normalizedTime = normalizeTime(time)
  const fallback = isEnd ? '23:59:59' : '00:00:00'
  return `${date}T${normalizedTime || fallback}`
}

function getMonthRange(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const firstDate = `${month}-01`
  const lastDay = new Date(year, monthNumber, 0).getDate()
  const lastDate = `${month}-${String(lastDay).padStart(2, '0')}`

  return {
    firstDate,
    lastDate,
    firstDateTime: `${firstDate}T00:00:00`,
    lastDateTime: `${lastDate}T23:59:59`,
  }
}

function getEffectiveAssignmentStart(row: AssignmentRow) {
  return row.start_datetime || buildDateTime(row.start_date, null, false)
}

function getEffectiveAssignmentEnd(row: AssignmentRow) {
  return row.end_datetime || buildDateTime(row.end_date || row.start_date, null, true)
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const month = url.searchParams.get('month')

    if (!month) {
      return NextResponse.json({ error: 'Thiếu tham số month' }, { status: 400 })
    }

    if (!isValidMonth(month)) {
      return NextResponse.json(
        { error: `Month không hợp lệ: ${month}. Định dạng đúng là YYYY-MM` },
        { status: 400 },
      )
    }

    const { firstDate, lastDate, firstDateTime, lastDateTime } = getMonthRange(month)
    const supabase = createClient()

    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .or(
        `and(start_datetime.lte.${lastDateTime},end_datetime.gte.${firstDateTime}),and(start_datetime.is.null,start_date.lte.${lastDate},end_date.gte.${firstDate})`,
      )
      .order('start_datetime', { ascending: true })
      .order('start_date', { ascending: true })

    if (assignmentsError) {
      return NextResponse.json({ error: assignmentsError.message }, { status: 500 })
    }

    const assignmentRows = ((assignments ?? []) as AssignmentRow[]).map((row) => ({
      ...row,
      start_datetime: getEffectiveAssignmentStart(row),
      end_datetime: getEffectiveAssignmentEnd(row),
    }))

    const bookingIds = Array.from(
      new Set(
        assignmentRows
          .map((item) => item.booking_id)
          .filter((value): value is string => Boolean(value)),
      ),
    )

    let legsByBookingId = new Map<string, LegRow[]>()

    if (bookingIds.length > 0) {
      const { data: legs, error: legsError } = await supabase
        .from('itinerary_legs')
        .select('*')
        .in('booking_id', bookingIds)
        .order('trip_date', { ascending: true })
        .order('pickup_time', { ascending: true })
        .order('seq_no', { ascending: true })

      if (legsError) {
        return NextResponse.json({ error: legsError.message }, { status: 500 })
      }

      const legRows = (legs ?? []) as LegRow[]

      legsByBookingId = legRows.reduce((map, leg) => {
        const current = map.get(leg.booking_id) ?? []
        current.push({
          ...leg,
          pickup_time: normalizeTime(leg.pickup_time),
          dropoff_time: normalizeTime(leg.dropoff_time),
        })
        map.set(leg.booking_id, current)
        return map
      }, new Map<string, LegRow[]>())
    }

    const result = assignmentRows.map((assignment) => ({
      ...assignment,
      legs: assignment.booking_id
        ? legsByBookingId.get(assignment.booking_id) ?? []
        : [],
    }))

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Không thể tải dữ liệu dispatch',
      },
      { status: 500 },
    )
  }
}