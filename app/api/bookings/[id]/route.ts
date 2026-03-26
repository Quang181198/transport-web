import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isValidUuid } from '../../../../lib/pdf/pdf-utils'
import type {
  BookingCreatePayload,
  BookingLegInput,
  BookingSource,
} from '../../../../lib/types/transport'

export const runtime = 'nodejs'

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
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

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    if (!id || !isValidUuid(id)) {
      return NextResponse.json(
        { error: `Booking id không hợp lệ: ${id}` },
        { status: 400 },
      )
    }

    const supabase = getServiceSupabase()

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: bookingError?.message || 'Không tìm thấy booking' },
        { status: 404 },
      )
    }

    const { data: legs, error: legsError } = await supabase
      .from('itinerary_legs')
      .select('*')
      .eq('booking_id', id)
      .order('trip_date', { ascending: true })
      .order('pickup_time', { ascending: true })
      .order('seq_no', { ascending: true })

    if (legsError) {
      return NextResponse.json({ error: legsError.message }, { status: 500 })
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, status, quotation_pdf_path')
      .eq('booking_id', id)
      .maybeSingle()

    if (assignmentError) {
      return NextResponse.json({ error: assignmentError.message }, { status: 500 })
    }

    let partnerCompanyName = ''

    if (booking.partner_company_id) {
      const { data: partnerCompany } = await supabase
        .from('partner_companies')
        .select('company_name')
        .eq('id', booking.partner_company_id)
        .maybeSingle()

      partnerCompanyName = partnerCompany?.company_name || ''
    }

    return NextResponse.json({
      success: true,
      data: {
        id: booking.id,
        bookingCode: booking.booking_code || '',
        groupName: booking.group_name || '',
        email: booking.email || '',
        phone: booking.phone || '',
        passengerCount: Number(booking.passenger_count || 0),
        vehicleType: booking.vehicle_type || '',
        startDate: booking.start_date || '',
        endDate: booking.end_date || '',
        startTime: booking.start_time || '',
        endTime: booking.end_time || '',
        pickupLocation: booking.pickup_location || '',
        dropoffLocation: booking.dropoff_location || '',
        unitPrice: Number(booking.unit_price || 0),
        notes: booking.notes || '',
        totalKm: Number(booking.total_km || 0),
        totalExtra: Number(booking.total_extra || 0),
        totalAmount: Number(booking.total_amount || 0),
        bookingSource: (booking.booking_source || 'direct') as BookingSource,
        partnerCompanyId: booking.partner_company_id || '',
        partnerCompanyName,
        assignmentId: assignment?.id || null,
        assignmentStatus: assignment?.status || null,
        quotationPdfPath: assignment?.quotation_pdf_path || null,
        legs: (legs ?? []).map((leg) => ({
          seqNo: Number(leg.seq_no || 0),
          tripDate: leg.trip_date || '',
          pickupTime: leg.pickup_time || '',
          dropoffTime: leg.dropoff_time || '',
          itinerary: leg.itinerary || '',
          distanceKm: Number(leg.distance_km || 0),
          note: leg.note || '',
          extraAmount: Number(leg.extra_amount || 0),
        })),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Không thể tải booking',
      },
      { status: 500 },
    )
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    if (!id || !isValidUuid(id)) {
      return NextResponse.json(
        { error: `Booking id không hợp lệ: ${id}` },
        { status: 400 },
      )
    }

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
      .update({
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
      .eq('id', id)
      .select('id, booking_code, group_name, vehicle_type, start_date, end_date')
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: bookingError?.message || 'Không thể cập nhật booking' },
        { status: 500 },
      )
    }

    const { error: deleteLegsError } = await supabase
      .from('itinerary_legs')
      .delete()
      .eq('booking_id', id)

    if (deleteLegsError) {
      return NextResponse.json(
        { error: `Không thể làm mới itinerary_legs: ${deleteLegsError.message}` },
        { status: 500 },
      )
    }

    if (normalizedLegs.length > 0) {
      const legsRows = normalizedLegs.map((leg) => ({
        booking_id: id,
        seq_no: leg.seqNo,
        trip_date: leg.tripDate || null,
        pickup_time: leg.pickupTime || null,
        dropoff_time: leg.dropoffTime || null,
        itinerary: leg.itinerary || null,
        distance_km: leg.distanceKm,
        note: leg.note || null,
        extra_amount: leg.extraAmount,
      }))

      const { error: legsInsertError } = await supabase
        .from('itinerary_legs')
        .insert(legsRows)

      if (legsInsertError) {
        return NextResponse.json(
          { error: `Không thể cập nhật itinerary_legs: ${legsInsertError.message}` },
          { status: 500 },
        )
      }
    }

    const { data: assignment, error: assignmentLookupError } = await supabase
      .from('assignments')
      .select('id')
      .eq('booking_id', id)
      .maybeSingle()

    if (assignmentLookupError) {
      return NextResponse.json(
        { error: assignmentLookupError.message },
        { status: 500 },
      )
    }

    if (assignment?.id) {
      const { error: assignmentUpdateError } = await supabase
        .from('assignments')
        .update({
          booking_code: booking.booking_code,
          group_name: booking.group_name,
          start_date: startDate || booking.start_date,
          end_date: endDate || booking.end_date || startDate,
          start_datetime: startDateTime,
          end_datetime: endDateTime,
          vehicle_type: booking.vehicle_type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignment.id)

      if (assignmentUpdateError) {
        return NextResponse.json(
          { error: `Không thể sync assignment: ${assignmentUpdateError.message}` },
          { status: 500 },
        )
      }
    } else {
      const { error: assignmentCreateError } = await supabase
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

      if (assignmentCreateError) {
        return NextResponse.json(
          { error: `Không thể tạo lại assignment: ${assignmentCreateError.message}` },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật booking và sync assignment',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Không thể cập nhật booking',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    if (!id || !isValidUuid(id)) {
      return NextResponse.json(
        { error: `Booking id không hợp lệ: ${id}` },
        { status: 400 },
      )
    }

    const supabase = getServiceSupabase()

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, booking_code')
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: bookingError?.message || 'Không tìm thấy booking' },
        { status: 404 },
      )
    }

    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, quotation_pdf_path')
      .eq('booking_id', booking.id)

    if (assignmentsError) {
      return NextResponse.json(
        { error: `Không thể đọc assignments: ${assignmentsError.message}` },
        { status: 500 },
      )
    }

    const { data: quotations, error: quotationsError } = await supabase
      .from('quotations')
      .select('id, pdf_path')
      .eq('booking_id', booking.id)

    if (quotationsError) {
      return NextResponse.json(
        { error: `Không thể đọc quotations: ${quotationsError.message}` },
        { status: 500 },
      )
    }

    const assignmentPaths = (assignments ?? [])
      .map((item) => item.quotation_pdf_path)
      .filter((value): value is string => Boolean(value))

    const quotationPaths = (quotations ?? [])
      .map((item) => item.pdf_path)
      .filter((value): value is string => Boolean(value))

    const allPdfPaths = Array.from(new Set([...assignmentPaths, ...quotationPaths]))

    if (allPdfPaths.length > 0) {
      const { error: storageDeleteError } = await supabase.storage
        .from('quotations')
        .remove(allPdfPaths)

      if (storageDeleteError) {
        return NextResponse.json(
          { error: `Xóa file quotation thất bại: ${storageDeleteError.message}` },
          { status: 500 },
        )
      }
    }

    const { error: quotationDeleteError } = await supabase
      .from('quotations')
      .delete()
      .eq('booking_id', booking.id)

    if (quotationDeleteError) {
      return NextResponse.json(
        { error: `Xóa row quotations thất bại: ${quotationDeleteError.message}` },
        { status: 500 },
      )
    }

    const { error: assignmentDeleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('booking_id', booking.id)

    if (assignmentDeleteError) {
      return NextResponse.json(
        { error: `Xóa assignments thất bại: ${assignmentDeleteError.message}` },
        { status: 500 },
      )
    }

    const { error: legsDeleteError } = await supabase
      .from('itinerary_legs')
      .delete()
      .eq('booking_id', booking.id)

    if (legsDeleteError) {
      return NextResponse.json(
        { error: `Xóa itinerary_legs thất bại: ${legsDeleteError.message}` },
        { status: 500 },
      )
    }

    const { error: bookingDeleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', booking.id)

    if (bookingDeleteError) {
      return NextResponse.json(
        { error: `Xóa booking thất bại: ${bookingDeleteError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      deleted: {
        quotations: (quotations ?? []).length,
        assignments: (assignments ?? []).length,
        files: allPdfPaths.length,
      },
      message: 'Đã xóa booking gốc và toàn bộ dữ liệu liên quan',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Không thể xóa booking gốc',
      },
      { status: 500 },
    )
  }
}