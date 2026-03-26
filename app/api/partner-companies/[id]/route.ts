import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isValidUuid } from '../../../../lib/pdf/pdf-utils'

export const runtime = 'nodejs'

type PartnerCompanyPayload = {
  companyName?: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  taxCode?: string
  notes?: string
  isActive?: boolean
}

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function normalizeText(value: string) {
  return value.trim()
}

function isValidEmail(value: string) {
  if (!value) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    if (!id || !isValidUuid(id)) {
      return NextResponse.json(
        { error: `Partner company id không hợp lệ: ${id}` },
        { status: 400 },
      )
    }

    const rawPayload = (await req.json()) as PartnerCompanyPayload

    const payload = {
      companyName: normalizeText(rawPayload.companyName || ''),
      contactName: normalizeText(rawPayload.contactName || ''),
      phone: normalizeText(rawPayload.phone || ''),
      email: normalizeText(rawPayload.email || ''),
      address: normalizeText(rawPayload.address || ''),
      taxCode: normalizeText(rawPayload.taxCode || ''),
      notes: normalizeText(rawPayload.notes || ''),
      isActive: rawPayload.isActive ?? true,
    }

    if (!payload.companyName) {
      return NextResponse.json(
        { error: 'Tên công ty đối tác là bắt buộc' },
        { status: 400 },
      )
    }

    if (!isValidEmail(payload.email)) {
      return NextResponse.json(
        { error: 'Email công ty đối tác không hợp lệ' },
        { status: 400 },
      )
    }

    const supabase = getServiceSupabase()

    const { data: duplicated, error: duplicatedError } = await supabase
      .from('partner_companies')
      .select('id, company_name')
      .neq('id', id)
      .ilike('company_name', payload.companyName)
      .maybeSingle()

    if (duplicatedError) {
      return NextResponse.json({ error: duplicatedError.message }, { status: 500 })
    }

    if (duplicated?.id) {
      return NextResponse.json(
        { error: `Tên công ty đối tác đã tồn tại: ${duplicated.company_name}` },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from('partner_companies')
      .update({
        company_name: payload.companyName,
        contact_name: payload.contactName || null,
        phone: payload.phone || null,
        email: payload.email || null,
        address: payload.address || null,
        tax_code: payload.taxCode || null,
        notes: payload.notes || null,
        is_active: payload.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        'id, company_name, contact_name, phone, email, address, tax_code, notes, is_active, created_at, updated_at',
      )
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Không thể cập nhật công ty đối tác' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Đã cập nhật công ty đối tác thành công',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Không thể cập nhật công ty đối tác',
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
        { error: `Partner company id không hợp lệ: ${id}` },
        { status: 400 },
      )
    }

    const supabase = getServiceSupabase()

    const { data: usedBooking, error: usedBookingError } = await supabase
      .from('bookings')
      .select('id, booking_code')
      .eq('partner_company_id', id)
      .limit(1)
      .maybeSingle()

    if (usedBookingError) {
      return NextResponse.json({ error: usedBookingError.message }, { status: 500 })
    }

    if (usedBooking?.id) {
      return NextResponse.json(
        {
          error: `Không thể xóa công ty đối tác vì đang được booking sử dụng: ${usedBooking.booking_code}`,
        },
        { status: 400 },
      )
    }

    const { error } = await supabase
      .from('partner_companies')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa công ty đối tác thành công',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Không thể xóa công ty đối tác',
      },
      { status: 500 },
    )
  }
}