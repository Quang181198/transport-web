import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type ServicePackageRow = {
  id: string
  name: string | null
  category: string | null
  duration_days: number | null
  vehicle_type: string | null
  is_active: boolean | null
  source_url?: string | null
  source_note?: string | null
}

type ServicePackageLegRow = {
  id: string
  service_package_id: string | null
  seq_no: number | null
  day_no: number | null
  pickup_time: string | null
  dropoff_time: string | null
  itinerary: string | null
  distance_km: number | null
  note: string | null
  extra_amount: number | null
}

type ServicePackageUpdatePayload = {
  name?: string
  category?: string
  durationDays?: number
  vehicleType?: string
  isActive?: boolean
  sourceUrl?: string
  sourceNote?: string
  legs?: Array<{
    id?: string
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

function normalizePayload(payload: ServicePackageUpdatePayload) {
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

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Thiếu id gói dịch vụ' }, { status: 400 })
    }

    const supabase = createClient()

    const [{ data: servicePackage, error: packageError }, { data: legs, error: legsError }] =
      await Promise.all([
        supabase
          .from('service_packages')
          .select(
            'id, name, category, duration_days, vehicle_type, is_active, source_url, source_note',
          )
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('service_package_legs')
          .select(
            'id, service_package_id, seq_no, day_no, pickup_time, dropoff_time, itinerary, distance_km, note, extra_amount',
          )
          .eq('service_package_id', id)
          .order('seq_no', { ascending: true }),
      ])

    if (packageError) {
      return NextResponse.json({ error: packageError.message }, { status: 500 })
    }

    if (legsError) {
      return NextResponse.json({ error: legsError.message }, { status: 500 })
    }

    if (!servicePackage) {
      return NextResponse.json({ error: 'Không tìm thấy gói dịch vụ' }, { status: 404 })
    }

    const pkg = servicePackage as ServicePackageRow
    const legRows = (legs ?? []) as ServicePackageLegRow[]

    return NextResponse.json({
      success: true,
      data: {
        id: pkg.id,
        name: pkg.name || '',
        category: pkg.category || '',
        durationDays: Number(pkg.duration_days || 0),
        vehicleType: pkg.vehicle_type || '',
        isActive: Boolean(pkg.is_active),
        sourceUrl: pkg.source_url || '',
        sourceNote: pkg.source_note || '',
        legs: legRows.map((item) => ({
          id: item.id,
          servicePackageId: item.service_package_id || '',
          seqNo: Number(item.seq_no || 0),
          dayNo: Number(item.day_no || 0),
          pickupTime: item.pickup_time || '',
          dropoffTime: item.dropoff_time || '',
          itinerary: item.itinerary || '',
          distanceKm: Number(item.distance_km || 0),
          note: item.note || '',
          extraAmount: Number(item.extra_amount || 0),
        })),
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Không thể tải chi tiết gói dịch vụ' },
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

    if (!id) {
      return NextResponse.json({ error: 'Thiếu id gói dịch vụ' }, { status: 400 })
    }

    const rawPayload = (await req.json().catch(() => null)) as ServicePackageUpdatePayload | null
    const payload = normalizePayload(rawPayload || {})
    const validationError = validatePayload(payload)

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('service_packages')
      .update({
        name: payload.name,
        category: payload.category,
        duration_days: payload.duration_days,
        vehicle_type: payload.vehicle_type,
        is_active: payload.is_active,
        source_url: payload.source_url,
        source_note: payload.source_note,
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const { error: deleteLegsError } = await supabase
      .from('service_package_legs')
      .delete()
      .eq('service_package_id', id)

    if (deleteLegsError) {
      return NextResponse.json({ error: deleteLegsError.message }, { status: 500 })
    }

    if (payload.legs.length > 0) {
      const { error: insertLegsError } = await supabase.from('service_package_legs').insert(
        payload.legs.map((leg) => ({
          service_package_id: id,
          ...leg,
        })),
      )

      if (insertLegsError) {
        return NextResponse.json({ error: insertLegsError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Không thể cập nhật gói dịch vụ' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Thiếu id gói dịch vụ' }, { status: 400 })
    }

    const supabase = createClient()

    const { error } = await supabase.from('service_packages').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Không thể xóa gói dịch vụ' },
      { status: 500 },
    )
  }
}
