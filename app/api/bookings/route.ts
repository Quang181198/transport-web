import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type {
  BookingCreatePayload,
  BookingLegInput,
  BookingSource,
} from '../../../lib/types/transport'

export const runtime = 'nodejs'

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isValidMonth(value: string) {
  return /^\d{4}-\d{2}$/.test(value)
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function normalizeText(value: string) {
  return value.trim()
}

function normalizeLegs(legs: BookingLegInput[]) {
  return legs
    .map((leg, index) => ({
      seqNo: index + 1,
      tripDate: (leg.tripDate || '').trim(),
      pickupTime: (leg.pickupTime || '').trim(),
      dropoffTime: (leg.dropoffTime || '').trim(),
      itinerary: (leg.itinerary || '').trim(),
      distanceKm: Number(leg.distanceKm || 0),
      note: (leg.note || '').trim(),
      extraAmount: Number(leg.extraAmount || 0),
    }))
    .filter((leg) => {
      return Boolean(
        leg.tripDate ||
          leg.pickupTime ||
          leg.dropoffTime ||
          leg.itinerary ||
          leg.distanceKm > 0 ||
          leg.note ||
          leg.extraAmount > 0,
      )
    })
}

function isValidBookingSource(value: string): value is BookingSource {
  return value === 'direct' || value === 'partner'
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || '', 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function sanitizeSearchKeyword(value: string | null) {
  return (value || '')
    .trim()
    .replace(/[,%()]/g, ' ')
    .replace(/\s+/g, ' ')
}

function getMonthDateRange(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const firstDate = `${month}-01`
  const lastDay = new Date(year, monthNumber, 0).getDate()
  const lastDate = `${month}-${String(lastDay).padStart(2, '0')}`

  return {
    firstDate,
    lastDate,
  }
}

function validatePayload(payload: BookingCreatePayload) {
  if (!normalizeText(payload.bookingCode)) return 'Thiếu bookingCode'
  if (!normalizeText(payload.groupName)) return 'Thiếu groupName'
  if (!Array.isArray(payload.legs)) return 'Thiếu legs'
  if (!isValidBookingSource(payload.bookingSource)) return 'bookingSource không hợp lệ'

  if (payload.startDate && !isValidDate(payload.startDate)) {
    return 'startDate không đúng định dạng YYYY-MM-DD'
  }

  if (payload.endDate && !isValidDate(payload.endDate)) {
    return 'endDate không đúng định dạng YYYY-MM-DD'
  }

  if (payload.startTime && !isValidTime(payload.startTime)) {
    return 'startTime không đúng định dạng HH:mm'
  }

  if (payload.endTime && !isValidTime(payload.endTime)) {
    return 'endTime không đúng định dạng HH:mm'
  }

  if (payload.startDate && payload.endDate && payload.startDate > payload.endDate) {
    return 'Ngày kết thúc không được nhỏ hơn ngày khởi hành'
  }

  if (
    payload.startDate &&
    payload.endDate &&
    payload.startDate === payload.endDate &&
    payload.startTime &&
    payload.endTime &&
    payload.startTime > payload.endTime
  ) {
    return 'Giờ kết thúc không được nhỏ hơn giờ khởi hành khi cùng một ngày'
  }

  if (payload.bookingSource === 'partner' && !normalizeText(payload.partnerCompanyId || '')) {
    return 'Thiếu partnerCompanyId'
  }

  for (const [index, leg] of payload.legs.entries()) {
    if (leg.tripDate && !isValidDate(leg.tripDate)) {
      return `Ngày chặng ${index + 1} không đúng định dạng YYYY-MM-DD`
    }

    if (leg.pickupTime && !isValidTime(leg.pickupTime)) {
      return `Giờ đón chặng ${index + 1} không đúng định dạng HH:mm`
    }

    if (leg.dropoffTime && !isValidTime(leg.dropoffTime)) {
      return `Giờ trả chặng ${index + 1} không đúng định dạng HH:mm`
    }

    if ((leg.pickupTime && !leg.dropoffTime) || (!leg.pickupTime && leg.dropoffTime)) {
      return `Chặng ${index + 1} phải có đủ giờ đón và giờ trả`
    }

    if (leg.pickupTime && leg.dropoffTime && leg.pickupTime > leg.dropoffTime) {
      return `Giờ trả chặng ${index + 1} không được nhỏ hơn giờ đón`
    }

    if (Number(leg.distanceKm || 0) < 0) {
      return `Km chặng ${index + 1} không hợp lệ`
    }

    if (Number(leg.extraAmount || 0) < 0) {
      return `Phát sinh chặng ${index + 1} không hợp lệ`
    }
  }

  return null
}

function getAssignmentDateRange(
  payload: BookingCreatePayload,
  normalizedLegs: ReturnType<typeof normalizeLegs>,
) {
  const legDates = normalizedLegs
    .map((leg) => leg.tripDate)
    .filter((value): value is string => Boolean(value))
    .sort()

  const startDate = legDates[0] || payload.startDate || null
  const endDate =
    legDates.length > 0
      ? legDates[legDates.length - 1]
      : payload.endDate || payload.startDate || null

  return { startDate, endDate }
}

function getAssignmentDateTimeRange(
  payload: BookingCreatePayload,
  normalizedLegs: ReturnType<typeof normalizeLegs>,
  fallbackStartDate: string | null,
  fallbackEndDate: string | null,
) {
  const legStartCandidates = normalizedLegs
    .filter((leg) => leg.tripDate && leg.pickupTime)
    .map((leg) => `${leg.tripDate}T${leg.pickupTime}:00`)
    .sort()

  const legEndCandidates = normalizedLegs
    .filter((leg) => leg.tripDate && leg.dropoffTime)
    .map((leg) => `${leg.tripDate}T${leg.dropoffTime}:00`)
    .sort()

  const startDateTime =
    legStartCandidates[0] ||
    (payload.startDate && payload.startTime
      ? `${payload.startDate}T${payload.startTime}:00`
      : fallbackStartDate
        ? `${fallbackStartDate}T00:00:00`
        : null)

  const endDateTime =
    legEndCandidates[legEndCandidates.length - 1] ||
    (payload.endDate && payload.endTime
      ? `${payload.endDate}T${payload.endTime}:00`
      : fallbackEndDate
        ? `${fallbackEndDate}T23:59:59`
        : null)

  return {
    startDateTime,
    endDateTime,
  }
}

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function validatePartnerCompany(
  supabase: ReturnType<typeof getServiceSupabase>,
  bookingSource: BookingSource,
  partnerCompanyId: string,
) {
  if (bookingSource !== 'partner') {
    return null
  }

  const { data, error } = await supabase
    .from('partner_companies')
    .select('id, company_name, is_active')
    .eq('id', partnerCompanyId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    throw new Error('Không tìm thấy công ty đối tác đang hoạt động')
  }

  return data
}

export async function GET(req: Request) {
  try {
    const supabase = getServiceSupabase()
    const { searchParams } = new URL(req.url)

    const page = parsePositiveInt(searchParams.get('page'), 1)
    const requestedPageSize = parsePositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE)
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)

    const rawSearch = sanitizeSearchKeyword(searchParams.get('search'))
    const month = (searchParams.get('month') || '').trim()

    if (month && !isValidMonth(month)) {
      return NextResponse.json(
        { error: 'month không đúng định dạng YYYY-MM' },
        { status: 400 },
      )
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let matchedPartnerCompanyIds: string[] = []

    if (rawSearch) {
      const { data: partnerMatches, error: partnerMatchesError } = await supabase
        .from('partner_companies')
        .select('id')
        .ilike('company_name', `%${rawSearch}%`)
        .limit(100)

      if (partnerMatchesError) {
        return NextResponse.json(
          { error: partnerMatchesError.message },
          { status: 500 },
        )
      }

      matchedPartnerCompanyIds = (partnerMatches ?? []).map((item) => item.id)
    }

    let query = supabase
      .from('bookings')
      .select(
        'id, booking_code, group_name, email, phone, vehicle_type, start_date, end_date, start_time, end_time, total_amount, created_at, booking_source, partner_company_id',
        { count: 'exact' },
      )

    if (month) {
      const { firstDate, lastDate } = getMonthDateRange(month)
      query = query.gte('start_date', firstDate).lte('start_date', lastDate)
    }

    if (rawSearch) {
      const conditions = [
        `booking_code.ilike.%${rawSearch}%`,
        `group_name.ilike.%${rawSearch}%`,
        `phone.ilike.%${rawSearch}%`,
        `email.ilike.%${rawSearch}%`,
      ]

      if (matchedPartnerCompanyIds.length > 0) {
        conditions.push(`partner_company_id.in.(${matchedPartnerCompanyIds.join(',')})`)
      }

      query = query.or(conditions.join(','))
    }

    const { data: bookings, error: bookingsError, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message }, { status: 500 })
    }

    const bookingRows = bookings ?? []
    const bookingIds = bookingRows.map((item) => item.id)
    const partnerCompanyIds = Array.from(
      new Set(
        bookingRows
          .map((item) => item.partner_company_id)
          .filter((value): value is string => Boolean(value)),
      ),
    )

    let assignmentMap = new Map<
      string,
      {
        id: string
        status: string | null
        quotation_pdf_path: string | null
      }
    >()

    if (bookingIds.length > 0) {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id, booking_id, status, quotation_pdf_path')
        .in('booking_id', bookingIds)

      if (assignmentsError) {
        return NextResponse.json({ error: assignmentsError.message }, { status: 500 })
      }

      assignmentMap = new Map(
        (assignments ?? []).map((item) => [
          item.booking_id,
          {
            id: item.id,
            status: item.status,
            quotation_pdf_path: item.quotation_pdf_path,
          },
        ]),
      )
    }

    let partnerCompanyMap = new Map<string, string>()

    if (partnerCompanyIds.length > 0) {
      const { data: partners, error: partnersError } = await supabase
        .from('partner_companies')
        .select('id, company_name')
        .in('id', partnerCompanyIds)

      if (partnersError) {
        return NextResponse.json({ error: partnersError.message }, { status: 500 })
      }

      partnerCompanyMap = new Map(
        (partners ?? []).map((item) => [item.id, item.company_name]),
      )
    }

    const result = bookingRows.map((booking) => {
      const assignment = assignmentMap.get(booking.id)

      return {
        ...booking,
        partner_company_name: booking.partner_company_id
          ? partnerCompanyMap.get(booking.partner_company_id) || null
          : null,
        assignment_id: assignment?.id || null,
        assignment_status: assignment?.status || null,
        quotation_pdf_path: assignment?.quotation_pdf_path || null,
      }
    })

    const total = count ?? 0
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0

    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      filter: {
        search: rawSearch,
        month: month || null,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Không thể tải danh sách booking',
      },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  let createdBookingId: string | null = null

  try {
    const rawPayload = (await req.json()) as BookingCreatePayload
    const validationError = validatePayload(rawPayload)

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const payload: BookingCreatePayload = {
      bookingCode: normalizeText(rawPayload.bookingCode),
      groupName: normalizeText(rawPayload.groupName),
      email: normalizeText(rawPayload.email || ''),
      phone: normalizeText(rawPayload.phone || ''),
      passengerCount: Number(rawPayload.passengerCount || 0),
      vehicleType: normalizeText(rawPayload.vehicleType || ''),
      startDate: (rawPayload.startDate || '').trim(),
      endDate: (rawPayload.endDate || '').trim(),
      startTime: (rawPayload.startTime || '').trim(),
      endTime: (rawPayload.endTime || '').trim(),
      pickupLocation: normalizeText(rawPayload.pickupLocation || ''),
      dropoffLocation: normalizeText(rawPayload.dropoffLocation || ''),
      unitPrice: Number(rawPayload.unitPrice || 0),
      notes: normalizeText(rawPayload.notes || ''),
      totalKm: Number(rawPayload.totalKm || 0),
      totalExtra: Number(rawPayload.totalExtra || 0),
      totalAmount: Number(rawPayload.totalAmount || 0),
      bookingSource: rawPayload.bookingSource,
      partnerCompanyId: normalizeText(rawPayload.partnerCompanyId || ''),
      legs: rawPayload.legs || [],
    }

    const normalizedLegs = normalizeLegs(payload.legs)
    const { startDate, endDate } = getAssignmentDateRange(payload, normalizedLegs)
    const { startDateTime, endDateTime } = getAssignmentDateTimeRange(
      payload,
      normalizedLegs,
      startDate,
      endDate,
    )

    const supabase = getServiceSupabase()

    await validatePartnerCompany(
      supabase,
      payload.bookingSource,
      payload.partnerCompanyId,
    )

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_code: payload.bookingCode,
        group_name: payload.groupName,
        email: payload.email || null,
        phone: payload.phone || null,
        passenger_count: payload.passengerCount,
        vehicle_type: payload.vehicleType || null,
        start_date: payload.startDate || startDate,
        end_date: payload.endDate || endDate,
        start_time: payload.startTime || null,
        end_time: payload.endTime || null,
        pickup_location: payload.pickupLocation || null,
        dropoff_location: payload.dropoffLocation || null,
        unit_price: payload.unitPrice,
        total_km: payload.totalKm,
        total_extra: payload.totalExtra,
        total_amount: payload.totalAmount,
        notes: payload.notes || null,
        booking_source: payload.bookingSource,
        partner_company_id:
          payload.bookingSource === 'partner' ? payload.partnerCompanyId : null,
      })
      .select('id, booking_code, group_name, vehicle_type, start_date, end_date')
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: `Lỗi lưu booking: ${bookingError?.message || 'Unknown error'}` },
        { status: 500 },
      )
    }

    createdBookingId = booking.id

    if (normalizedLegs.length > 0) {
      const legsRows = normalizedLegs.map((leg) => ({
        booking_id: booking.id,
        seq_no: leg.seqNo,
        trip_date: leg.tripDate || null,
        pickup_time: leg.pickupTime || null,
        dropoff_time: leg.dropoffTime || null,
        itinerary: leg.itinerary || null,
        distance_km: leg.distanceKm,
        note: leg.note || null,
        extra_amount: leg.extraAmount,
      }))

      const { error: legsError } = await supabase
        .from('itinerary_legs')
        .insert(legsRows)

      if (legsError) {
        await supabase.from('bookings').delete().eq('id', booking.id)

        return NextResponse.json(
          { error: `Lỗi lưu chặng: ${legsError.message}` },
          { status: 500 },
        )
      }
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        booking_id: booking.id,
        booking_code: booking.booking_code,
        group_name: booking.group_name,
        start_date: startDate || booking.start_date,
        end_date: endDate || booking.end_date || startDate,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        vehicle_type: booking.vehicle_type,
        vehicle_id: null,
        driver_id: null,
        vehicle_assigned: null,
        driver_assigned: null,
        status: 'pending',
        quotation_pdf_path: null,
      })
      .select('id')
      .single()

    if (assignmentError || !assignment) {
      await supabase.from('itinerary_legs').delete().eq('booking_id', booking.id)
      await supabase.from('bookings').delete().eq('id', booking.id)

      return NextResponse.json(
        {
          error: `Lỗi tạo assignment nháp: ${assignmentError?.message || 'Unknown error'}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      assignmentId: assignment.id,
      message: 'Đã lưu booking, itinerary và tạo assignment nháp',
    })
  } catch (error) {
    if (createdBookingId) {
      const supabase = getServiceSupabase()

      await supabase.from('assignments').delete().eq('booking_id', createdBookingId)
      await supabase.from('itinerary_legs').delete().eq('booking_id', createdBookingId)
      await supabase.from('bookings').delete().eq('id', createdBookingId)
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Lỗi không xác định khi lưu booking',
      },
      { status: 500 },
    )
  }
}