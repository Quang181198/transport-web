import { NextResponse } from 'next/server'
import {
  ensureFinalInvoicePdfByAssignment,
  getFinalInvoicePdfUrlByAssignment,
} from '../../../../../lib/pdf/quotation-service'
import { isValidUuid } from '../../../../../lib/pdf/pdf-utils'

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

    const url = await getFinalInvoicePdfUrlByAssignment(id)

    return NextResponse.json({ url })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Không thể mở hóa đơn final' },
      { status: 500 },
    )
  }
}

export async function POST(
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

    const result = await ensureFinalInvoicePdfByAssignment(id)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Không thể tạo hóa đơn final PDF' },
      { status: 500 },
    )
  }
}