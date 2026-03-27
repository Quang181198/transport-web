import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type ServicePackageInsertPayload = {
  name?: string
  category?: string
  durationDays?: number
  vehicleType?: string
  isActive?: boolean
  sourceUrl?: string
  sourceNote?: string
  legs?: Array<{
    seqNo?: number
    dayNo?: number
    pickupTime?: string
    dropoffTime?: string
    itinerary?: string
    distanceKm?: number
    note?: string
    extraAmount?: number
  }>
}

type ServicePackageRow = {
  id: string
  name: string | null
  category: string | null
  duration_days: number | null
  vehicle_type: string | null
  is_active: boolean | null
  source_url?: string | null
  source_note?: string | null
  created_at?: string | null
}

function normalizePayload(payload: ServicePackageInsertPayload) {
  const normalizedLegs = Array.isArray(payload.legs)
    ? payload.legs.map((leg, index) => ({
        seq_no: Number(leg.seqNo || index + 1),
        day_no: Number(leg.dayNo || index + 1),
        pickup_time: (leg.pickupTime || '').trim() || null,
        dropoff_time: (leg.dropoffTime || '').trim() || null,
        itinerary: (leg.itinerary || '').trim(),
        distance_km: Number(leg.distanceKm || 0),
        note: (leg.note || '').trim() || null,
        extra_amount: Number(leg.extraAmount || 0),
      }))
    : []

  return {
    name: (payload.name || '').trim(),
    category: (payload.category || '').trim(),
    duration_days: Number(payload.durationDays || 0),
    vehicle_type: (payload.vehicleType || '').trim(),
    is_active: Boolean(payload.isActive),
    source_url: (payload.sourceUrl || '').trim() || null,
    source_note: (payload.sourceNote || '').trim() || null,
    legs: normalizedLegs,
  }
}

function validatePayload(payload: ReturnType<typeof normalizePayload>) {
  if (!payload.name) return 'Vui lòng nhập tên gói dịch vụ.'
  if (!payload.category) return 'Vui lòng chọn nhóm dịch vụ.'
  if (payload.duration_days <= 0) return 'Số ngày phải lớn hơn 0.'

  for (const [index, leg] of payload.legs.entries()) {
    if (!leg.itinerary) {
      return `Vui lòng nhập lịch trình cho chặng ${index + 1}.`
    }

    if (Number(leg.day_no || 0) <= 0) {
      return `Day no của chặng ${index + 1} phải lớn hơn 0.`
    }
  }

  return null
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = (searchParams.get('search') || '').trim()
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const supabase = createClient()

    let query = supabase
      .from('service_packages')
      .select(
        'id, name, category, duration_days, vehicle_type, is_active, source_url, source_note, created_at',
      )
      .order('name', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    if (search) {
      const escaped = search.replace(/,/g, ' ')
      query = query.or(
        [
          `name.ilike.%${escaped}%`,
          `category.ilike.%${escaped}%`,
          `vehicle_type.ilike.%${escaped}%`,
          `source_note.ilike.%${escaped}%`,
        ].join(','),
      )
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = ((data ?? []) as ServicePackageRow[]).map((item) => ({
      id: item.id,
      name: item.name || '',
      category: item.category || '',
      durationDays: Number(item.duration_days || 0),
      vehicleType: item.vehicle_type || '',
      isActive: Boolean(item.is_active),
      sourceUrl: item.source_url || '',
      sourceNote: item.source_note || '',
      createdAt: item.created_at || '',
    }))

    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Không thể tải gói dịch vụ' },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const rawPayload = (await req.json().catch(() => null)) as ServicePackageInsertPayload | null
    const payload = normalizePayload(rawPayload || {})
    const validationError = validatePayload(payload)

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const supabase = createClient()

    const { data: createdPackage, error: createPackageError } = await supabase
      .from('service_packages')
      .insert({
        name: payload.name,
        category: payload.category,
        duration_days: payload.duration_days,
        vehicle_type: payload.vehicle_type,
        is_active: payload.is_active,
        source_url: payload.source_url,
        source_note: payload.source_note,
      })
      .select('id')
      .single()

    if (createPackageError || !createdPackage?.id) {
      return NextResponse.json(
        { error: createPackageError?.message || 'Không thể tạo gói dịch vụ' },
        { status: 500 },
      )
    }

    if (payload.legs.length > 0) {
      const { error: legsError } = await supabase.from('service_package_legs').insert(
        payload.legs.map((leg) => ({
          service_package_id: createdPackage.id,
          ...leg,
        })),
      )

      if (legsError) {
        await supabase.from('service_packages').delete().eq('id', createdPackage.id)
        return NextResponse.json({ error: legsError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: createdPackage.id,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Không thể tạo gói dịch vụ' },
      { status: 500 },
    )
  }
}
