import { renderToStream } from '@react-pdf/renderer'
import { NextResponse } from 'next/server'
import DispatchOrderPdfDocument from '../../../../../components/pdf/dispatch-order-pdf'
import { createClient } from '../../../../../lib/supabase/server'
import type {
  AssignmentRecord,
  DispatchOrderPayload,
  ItineraryLegRecord,
} from '../../../../../lib/types/transport'
import { COMPANY_INFO } from '../../../../../lib/pdf/company-info'
import {
  fileToDataUri,
  isValidUuid,
  registerPdfFontsOnce,
  sanitizeFileName,
  streamToBuffer,
} from '../../../../../lib/pdf/pdf-utils'

type BookingRow = {
  phone: string | null
  pickup_location: string | null
  dropoff_location: string | null
  notes: string | null
  start_time: string | null
  end_time: string | null
}

function normalizeTime(value?: string | null) {
  if (!value) return ''
  return String(value).slice(0, 8)
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    if (!id || !isValidUuid(id)) {
      return NextResponse.json(
        { error: `Assignment id không hợp lệ: ${id}` },
        { status: 400 },
      )
    }

    const supabase = createClient()

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: assignmentError?.message || 'Không tìm thấy assignment' },
        { status: 404 },
      )
    }

    const assignmentRow = assignment as AssignmentRecord

    let booking: BookingRow | null = null
    if (assignmentRow.booking_id) {
      const { data: bookingRow, error: bookingError } = await supabase
        .from('bookings')
        .select('phone, pickup_location, dropoff_location, notes, start_time, end_time')
        .eq('id', assignmentRow.booking_id)
        .maybeSingle()

      if (bookingError) {
        return NextResponse.json(
          { error: bookingError.message },
          { status: 500 },
        )
      }

      booking = bookingRow as BookingRow | null
    }

    let legs: ItineraryLegRecord[] = []

    if (assignmentRow.booking_id) {
      const { data: legRows, error: legsError } = await supabase
        .from('itinerary_legs')
        .select('*')
        .eq('booking_id', assignmentRow.booking_id)
        .order('trip_date', { ascending: true })
        .order('pickup_time', { ascending: true })
        .order('seq_no', { ascending: true })

      if (legsError) {
        return NextResponse.json(
          { error: legsError.message },
          { status: 500 },
        )
      }

      legs = ((legRows ?? []) as ItineraryLegRecord[]).map((leg) => ({
        ...leg,
        pickup_time: normalizeTime(leg.pickup_time),
        dropoff_time: normalizeTime(leg.dropoff_time),
      }))
    }

    const payload: DispatchOrderPayload = {
      bookingCode: assignmentRow.booking_code || '',
      groupName: assignmentRow.group_name || '',
      startDate: assignmentRow.start_date || '',
      endDate: assignmentRow.end_date || '',
      startTime: booking?.start_time ? normalizeTime(booking.start_time) : '',
      endTime: booking?.end_time ? normalizeTime(booking.end_time) : '',
      vehicleType: assignmentRow.vehicle_type || '',
      vehicleAssigned: assignmentRow.vehicle_assigned || '',
      driverAssigned: assignmentRow.driver_assigned || '',
      status: assignmentRow.status || 'pending',
      phone: booking?.phone || '',
      pickupLocation: booking?.pickup_location || '',
      dropoffLocation: booking?.dropoff_location || '',
      notes: booking?.notes || '',
      legs: legs.map((leg) => ({
        seqNo: Number(leg.seq_no || 0),
        tripDate: leg.trip_date || '',
        pickupTime: normalizeTime(leg.pickup_time),
        dropoffTime: normalizeTime(leg.dropoff_time),
        itinerary: leg.itinerary || '',
        distanceKm: Number(leg.distance_km || 0),
        note: leg.note || '',
      })),
    }

    const useVietnameseFont = await registerPdfFontsOnce()
    const logoSrc = await fileToDataUri('logo-company.png')

    const stream = await renderToStream(
      <DispatchOrderPdfDocument
        company={COMPANY_INFO}
        order={payload}
        logoSrc={logoSrc}
        useVietnameseFont={useVietnameseFont}
      />,
    )

    const pdfBuffer = await streamToBuffer(stream as NodeJS.ReadableStream)
    const safeCode = sanitizeFileName(assignmentRow.booking_code || 'dispatch-order')
    const fileName = `dispatch-order-${safeCode}.pdf`

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Không thể tạo PDF lệnh điều xe',
      },
      { status: 500 },
    )
  }
}