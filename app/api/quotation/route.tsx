import { NextResponse } from 'next/server'
import {
  createPreliminaryQuotationPdfByAssignment,
  createPreliminaryQuotationPdfByBooking,
} from '../../../lib/pdf/quotation-service'
import { isValidUuid } from '../../../lib/pdf/pdf-utils'

type CreateQuotationBody = {
  assignment_id?: string
  booking_id?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as CreateQuotationBody

    if (body.assignment_id) {
      if (!isValidUuid(body.assignment_id)) {
        return NextResponse.json(
          { error: `assignment_id không hợp lệ: ${body.assignment_id}` },
          { status: 400 },
        )
      }

      const result = await createPreliminaryQuotationPdfByAssignment(body.assignment_id)
      return NextResponse.json(result)
    }

    if (body.booking_id) {
      if (!isValidUuid(body.booking_id)) {
        return NextResponse.json(
          { error: `booking_id không hợp lệ: ${body.booking_id}` },
          { status: 400 },
        )
      }

      const result = await createPreliminaryQuotationPdfByBooking(body.booking_id)
      return NextResponse.json(result)
    }

    return NextResponse.json(
      { error: 'Thiếu assignment_id hoặc booking_id' },
      { status: 400 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Không thể tạo báo giá sơ bộ PDF',
      },
      { status: 500 },
    )
  }
}