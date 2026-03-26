import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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

export async function GET() {
  try {
    const supabase = getServiceSupabase()

    const { data, error } = await supabase
      .from('partner_companies')
      .select(
        'id, company_name, contact_name, phone, email, address, tax_code, notes, is_active, created_at, updated_at',
      )
      .order('company_name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Không thể tải danh sách công ty đối tác',
      },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
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

    const { data: existing, error: existingError } = await supabase
      .from('partner_companies')
      .select('id, company_name')
      .ilike('company_name', payload.companyName)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    if (existing?.id) {
      return NextResponse.json(
        { error: `Công ty đối tác đã tồn tại: ${existing.company_name}` },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from('partner_companies')
      .insert({
        company_name: payload.companyName,
        contact_name: payload.contactName || null,
        phone: payload.phone || null,
        email: payload.email || null,
        address: payload.address || null,
        tax_code: payload.taxCode || null,
        notes: payload.notes || null,
        is_active: payload.isActive,
      })
      .select(
        'id, company_name, contact_name, phone, email, address, tax_code, notes, is_active, created_at, updated_at',
      )
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Không thể tạo công ty đối tác' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Đã tạo công ty đối tác thành công',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Không thể tạo công ty đối tác',
      },
      { status: 500 },
    )
  }
}