import { renderToStream } from '@react-pdf/renderer'
import QuotationPdfDocument from '../../components/pdf/quotation-pdf'
import { createClient } from '../supabase/server'
import type {
  AssignmentRecord,
  ItineraryLegRecord,
  QuotationPayload,
} from '../types/transport'
import { getCompanyInfo } from '../settings/get-company-info'
import {
  fileToDataUri,
  registerPdfFontsOnce,
  sanitizeFileName,
  streamToBuffer,
} from './pdf-utils'

type BookingRow = {
  id: string
  booking_code: string
  group_name: string | null
  email: string | null
  phone: string | null
  passenger_count: number | null
  vehicle_type: string | null
  start_date: string | null
  end_date: string | null
  pickup_location: string | null
  dropoff_location: string | null
  unit_price: number | null
  notes: string | null
  total_km: number | null
  total_extra: number | null
  total_amount: number | null
}

type PdfVariant = 'preliminary' | 'final'

type PdfResult = {
  success: true
  reused: boolean
  path: string
  url: string
}

async function createSignedPdfUrl(pdfPath: string, expiresInSeconds = 60 * 60) {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from('quotations')
    .createSignedUrl(pdfPath, expiresInSeconds)

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Không tạo được link PDF')
  }

  return data.signedUrl
}

async function getBookingById(bookingId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Không tìm thấy booking')
  }

  return data as BookingRow
}

async function getAssignmentById(assignmentId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Không tìm thấy assignment')
  }

  return data as AssignmentRecord
}

async function getLegsByBookingId(bookingId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('itinerary_legs')
    .select('*')
    .eq('booking_id', bookingId)
    .order('trip_date', { ascending: true })
    .order('seq_no', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as ItineraryLegRecord[]
}

function mapQuotationPayload(
  booking: BookingRow,
  legs: ItineraryLegRecord[],
): QuotationPayload {
  return {
    bookingCode: booking.booking_code || '',
    groupName: booking.group_name || '',
    email: booking.email || '',
    phone: booking.phone || '',
    passengerCount: Number(booking.passenger_count || 0),
    vehicleType: booking.vehicle_type || '',
    startDate: booking.start_date || '',
    endDate: booking.end_date || '',
    pickupLocation: booking.pickup_location || '',
    dropoffLocation: booking.dropoff_location || '',
    unitPrice: Number(booking.unit_price || 0),
    notes: booking.notes || '',
    totalKm: Number(booking.total_km || 0),
    totalExtra: Number(booking.total_extra || 0),
    totalAmount: Number(booking.total_amount || 0),
    legs: legs.map((leg) => ({
      seqNo: Number(leg.seq_no || 0),
      tripDate: leg.trip_date || '',
      itinerary: leg.itinerary || '',
      distanceKm: Number(leg.distance_km || 0),
      note: leg.note || '',
      extraAmount: Number(leg.extra_amount || 0),
    })),
  }
}

async function generateAndStorePdf(options: {
  booking: BookingRow
  payload: QuotationPayload
  variant: PdfVariant
  assignmentId?: string
}): Promise<PdfResult> {
  const { booking, payload, variant, assignmentId } = options

  const supabase = createClient()
  const companyInfo = await getCompanyInfo()
  const useVietnameseFont = await registerPdfFontsOnce()
  const logoSrc = await fileToDataUri('logo-company.png')

  const stream = await renderToStream(
    <QuotationPdfDocument
      company={companyInfo}
      booking={payload}
      logoSrc={logoSrc}
      useVietnameseFont={useVietnameseFont}
      variant={variant}
    />,
  )

  const pdfBuffer = await streamToBuffer(stream as NodeJS.ReadableStream)

  const now = new Date()
  const yyyy = String(now.getFullYear())
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const safeCode = sanitizeFileName(booking.booking_code || 'quotation')
  const prefix = variant === 'final' ? 'final-invoice' : 'preliminary-quotation'
  const fileName = `${prefix}-${safeCode}.pdf`
  const storagePath = `${yyyy}/${mm}/${prefix}-${safeCode}-${Date.now()}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('quotations')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Upload PDF thất bại: ${uploadError.message}`)
  }

  const { error: quotationInsertError } = await supabase.from('quotations').insert({
    booking_id: booking.id,
    booking_code: booking.booking_code,
    pdf_path: storagePath,
    file_name: fileName,
    total_amount: payload.totalAmount,
  })

  if (quotationInsertError) {
    await supabase.storage.from('quotations').remove([storagePath])
    throw new Error(`Lưu quotations thất bại: ${quotationInsertError.message}`)
  }

  if (assignmentId && variant === 'final') {
    const { error: updateAssignmentError } = await supabase
      .from('assignments')
      .update({
        quotation_pdf_path: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)

    if (updateAssignmentError) {
      await supabase.storage.from('quotations').remove([storagePath])
      await supabase.from('quotations').delete().eq('pdf_path', storagePath)
      throw new Error(`Cập nhật assignment thất bại: ${updateAssignmentError.message}`)
    }
  }

  const url = await createSignedPdfUrl(storagePath)

  return {
    success: true,
    reused: false,
    path: storagePath,
    url,
  }
}

export async function createPreliminaryQuotationPdfByBooking(
  bookingId: string,
): Promise<PdfResult> {
  const booking = await getBookingById(bookingId)
  const legs = await getLegsByBookingId(booking.id)
  const payload = mapQuotationPayload(booking, legs)

  return generateAndStorePdf({
    booking,
    payload,
    variant: 'preliminary',
  })
}

export async function createPreliminaryQuotationPdfByAssignment(
  assignmentId: string,
): Promise<PdfResult> {
  const assignment = await getAssignmentById(assignmentId)

  if (!assignment.booking_id) {
    throw new Error('Assignment chưa có booking_id')
  }

  const booking = await getBookingById(assignment.booking_id)
  const legs = await getLegsByBookingId(booking.id)
  const payload = mapQuotationPayload(booking, legs)

  return generateAndStorePdf({
    booking,
    payload,
    variant: 'preliminary',
  })
}

export async function ensureFinalInvoicePdfByAssignment(
  assignmentId: string,
): Promise<PdfResult> {
  const assignment = await getAssignmentById(assignmentId)

  if (!assignment.booking_id) {
    throw new Error('Assignment chưa có booking_id')
  }

  // Always regenerate with the latest booking & itinerary data
  const booking = await getBookingById(assignment.booking_id)
  const legs = await getLegsByBookingId(booking.id)
  const payload = mapQuotationPayload(booking, legs)

  return generateAndStorePdf({
    booking,
    payload,
    variant: 'final',
    assignmentId: assignment.id,
  })
}

export async function getFinalInvoicePdfUrlByAssignment(assignmentId: string) {
  const assignment = await getAssignmentById(assignmentId)

  if (!assignment.quotation_pdf_path) {
    throw new Error('Chưa có hóa đơn final PDF')
  }

  return createSignedPdfUrl(assignment.quotation_pdf_path)
}