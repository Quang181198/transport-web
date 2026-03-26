import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidUuid } from '@/lib/pdf/pdf-utils'

export const runtime = 'nodejs'

type VehiclePayload = {
  resourceType: 'vehicle'
  mode?: 'create' | 'update' | 'import'
  id?: string
  plate_number?: string
  vehicle_name?: string
  seat_count?: number
  is_active?: boolean
  rows?: Record<string, string>[]
}

type DriverPayload = {
  resourceType: 'driver'
  mode?: 'create' | 'update' | 'import'
  id?: string
  full_name?: string
  phone?: string
  is_active?: boolean
  rows?: Record<string, string>[]
}

type ResourcePayload = VehiclePayload | DriverPayload

function normalizePlateNumber(value: string) {
  return value.trim().replace(/\s+/g, '').toUpperCase()
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

function parseBooleanValue(
  value: string | boolean | undefined,
  defaultValue = true,
) {
  if (typeof value === 'boolean') return value
  if (value === undefined) return defaultValue

  const normalized = String(value).trim().toLowerCase()

  if (['true', '1', 'yes', 'y'].includes(normalized)) return true
  if (['false', '0', 'no', 'n'].includes(normalized)) return false

  return defaultValue
}

export async function GET() {
  try {
    const supabase = createClient()

    const [
      { data: vehicles, error: vehiclesError },
      { data: drivers, error: driversError },
    ] = await Promise.all([
      supabase
        .from('vehicles')
        .select('id, plate_number, vehicle_name, seat_count, is_active')
        .order('plate_number', { ascending: true }),
      supabase
        .from('drivers')
        .select('id, full_name, phone, is_active')
        .order('full_name', { ascending: true }),
    ])

    if (vehiclesError) {
      return NextResponse.json({ error: vehiclesError.message }, { status: 500 })
    }

    if (driversError) {
      return NextResponse.json({ error: driversError.message }, { status: 500 })
    }

    return NextResponse.json({
      vehicles: vehicles ?? [],
      drivers: drivers ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Cannot load resources',
      },
      { status: 500 },
    )
  }
}

async function importVehicles(rows: Record<string, string>[]) {
  const supabase = createClient()
  const errors: Array<{ rowNumber: number; message: string }> = []

  const { data: existingVehicles, error: existingError } = await supabase
    .from('vehicles')
    .select('plate_number_normalized')

  if (existingError) {
    throw new Error(existingError.message)
  }

  const existingPlateSet = new Set(
    (existingVehicles ?? [])
      .map((item) => item.plate_number_normalized)
      .filter((value): value is string => Boolean(value)),
  )

  const batchPlateSet = new Set<string>()
  const insertRows: Array<{
    plate_number: string
    plate_number_normalized: string
    vehicle_name: string | null
    seat_count: number
    is_active: boolean
  }> = []

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const plateNumber = normalizePlateNumber(row.plate_number || '')
    const seatCount = Number(row.seat_count || 0)
    const isActive = parseBooleanValue(row.is_active, true)

    if (!plateNumber) {
      errors.push({ rowNumber, message: 'Missing plate_number' })
      return
    }

    if (Number.isNaN(seatCount) || seatCount < 0) {
      errors.push({ rowNumber, message: 'Invalid seat_count' })
      return
    }

    if (batchPlateSet.has(plateNumber)) {
      errors.push({
        rowNumber,
        message: 'Duplicate plate_number inside CSV file',
      })
      return
    }

    if (existingPlateSet.has(plateNumber)) {
      errors.push({
        rowNumber,
        message: 'Duplicate plate_number already exists in database',
      })
      return
    }

    batchPlateSet.add(plateNumber)

    insertRows.push({
      plate_number: plateNumber,
      plate_number_normalized: plateNumber,
      vehicle_name: (row.vehicle_name || '').trim() || null,
      seat_count: seatCount,
      is_active: isActive,
    })
  })

  if (insertRows.length > 0) {
    const { error: insertError } = await supabase.from('vehicles').insert(insertRows)

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  return {
    success: true,
    resourceType: 'vehicle' as const,
    totalRows: rows.length,
    importedCount: insertRows.length,
    skippedCount: errors.length,
    errors,
  }
}

async function importDrivers(rows: Record<string, string>[]) {
  const supabase = createClient()
  const errors: Array<{ rowNumber: number; message: string }> = []

  const { data: existingDrivers, error: existingError } = await supabase
    .from('drivers')
    .select('phone_normalized')

  if (existingError) {
    throw new Error(existingError.message)
  }

  const existingPhoneSet = new Set(
    (existingDrivers ?? [])
      .map((item) => item.phone_normalized)
      .filter((value): value is string => Boolean(value)),
  )

  const batchPhoneSet = new Set<string>()
  const insertRows: Array<{
    full_name: string
    phone: string | null
    phone_normalized: string
    is_active: boolean
  }> = []

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const fullName = (row.full_name || '').trim()
    const rawPhone = (row.phone || '').trim()
    const phone = normalizePhone(rawPhone)
    const isActive = parseBooleanValue(row.is_active, true)

    if (!fullName) {
      errors.push({ rowNumber, message: 'Missing full_name' })
      return
    }

    if (!phone) {
      errors.push({ rowNumber, message: 'Missing or invalid phone' })
      return
    }

    if (batchPhoneSet.has(phone)) {
      errors.push({ rowNumber, message: 'Duplicate phone inside CSV file' })
      return
    }

    if (existingPhoneSet.has(phone)) {
      errors.push({
        rowNumber,
        message: 'Duplicate phone already exists in database',
      })
      return
    }

    batchPhoneSet.add(phone)

    insertRows.push({
      full_name: fullName,
      phone: rawPhone || null,
      phone_normalized: phone,
      is_active: isActive,
    })
  })

  if (insertRows.length > 0) {
    const { error: insertError } = await supabase.from('drivers').insert(insertRows)

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  return {
    success: true,
    resourceType: 'driver' as const,
    totalRows: rows.length,
    importedCount: insertRows.length,
    skippedCount: errors.length,
    errors,
  }
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as ResourcePayload
    const supabase = createClient()

    if (payload.mode === 'import') {
      const rows = Array.isArray(payload.rows) ? payload.rows : []

      if (rows.length === 0) {
        return NextResponse.json({ error: 'No CSV rows to import' }, { status: 400 })
      }

      if (payload.resourceType === 'vehicle') {
        const result = await importVehicles(rows)
        return NextResponse.json(result)
      }

      const result = await importDrivers(rows)
      return NextResponse.json(result)
    }

    if (payload.resourceType === 'vehicle') {
      const plateNumber = normalizePlateNumber(payload.plate_number || '')

      if (!plateNumber) {
        return NextResponse.json({ error: 'plate_number is required' }, { status: 400 })
      }

      const { data: existed, error: existedError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('plate_number_normalized', plateNumber)
        .maybeSingle()

      if (existedError) {
        return NextResponse.json({ error: existedError.message }, { status: 500 })
      }

      if (existed) {
        return NextResponse.json(
          { error: 'Duplicate vehicle plate number' },
          { status: 409 },
        )
      }

      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          plate_number: plateNumber,
          plate_number_normalized: plateNumber,
          vehicle_name: payload.vehicle_name?.trim() || null,
          seat_count: Number(payload.seat_count || 0),
          is_active: payload.is_active ?? true,
        })
        .select('id, plate_number, vehicle_name, seat_count, is_active')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data,
        message: 'Vehicle created successfully',
      })
    }

    const fullName = payload.full_name?.trim() || ''
    const phone = normalizePhone(payload.phone || '')

    if (!fullName) {
      return NextResponse.json({ error: 'full_name is required' }, { status: 400 })
    }

    if (!phone) {
      return NextResponse.json({ error: 'phone is required' }, { status: 400 })
    }

    const { data: existed, error: existedError } = await supabase
      .from('drivers')
      .select('id')
      .eq('phone_normalized', phone)
      .maybeSingle()

    if (existedError) {
      return NextResponse.json({ error: existedError.message }, { status: 500 })
    }

    if (existed) {
      return NextResponse.json(
        { error: 'Duplicate driver phone number' },
        { status: 409 },
      )
    }

    const { data, error } = await supabase
      .from('drivers')
      .insert({
        full_name: fullName,
        phone: payload.phone?.trim() || null,
        phone_normalized: phone,
        is_active: payload.is_active ?? true,
      })
      .select('id, full_name, phone, is_active')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Driver created successfully',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Cannot create resource',
      },
      { status: 500 },
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const payload = (await req.json()) as ResourcePayload
    const supabase = createClient()

    if (!payload.id || !isValidUuid(payload.id)) {
      return NextResponse.json(
        { error: `Invalid id: ${payload.id}` },
        { status: 400 },
      )
    }

    if (payload.resourceType === 'vehicle') {
      const plateNumber = normalizePlateNumber(payload.plate_number || '')

      if (!plateNumber) {
        return NextResponse.json({ error: 'plate_number is required' }, { status: 400 })
      }

      const { data: existed, error: existedError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('plate_number_normalized', plateNumber)
        .neq('id', payload.id)
        .maybeSingle()

      if (existedError) {
        return NextResponse.json({ error: existedError.message }, { status: 500 })
      }

      if (existed) {
        return NextResponse.json(
          { error: 'Duplicate vehicle plate number' },
          { status: 409 },
        )
      }

      const { data, error } = await supabase
        .from('vehicles')
        .update({
          plate_number: plateNumber,
          plate_number_normalized: plateNumber,
          vehicle_name: payload.vehicle_name?.trim() || null,
          seat_count: Number(payload.seat_count || 0),
          is_active: payload.is_active ?? true,
        })
        .eq('id', payload.id)
        .select('id, plate_number, vehicle_name, seat_count, is_active')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data,
        message: 'Vehicle updated successfully',
      })
    }

    const fullName = payload.full_name?.trim() || ''
    const phone = normalizePhone(payload.phone || '')

    if (!fullName) {
      return NextResponse.json({ error: 'full_name is required' }, { status: 400 })
    }

    if (!phone) {
      return NextResponse.json({ error: 'phone is required' }, { status: 400 })
    }

    const { data: existed, error: existedError } = await supabase
      .from('drivers')
      .select('id')
      .eq('phone_normalized', phone)
      .neq('id', payload.id)
      .maybeSingle()

    if (existedError) {
      return NextResponse.json({ error: existedError.message }, { status: 500 })
    }

    if (existed) {
      return NextResponse.json(
        { error: 'Duplicate driver phone number' },
        { status: 409 },
      )
    }

    const { data, error } = await supabase
      .from('drivers')
      .update({
        full_name: fullName,
        phone: payload.phone?.trim() || null,
        phone_normalized: phone,
        is_active: payload.is_active ?? true,
      })
      .eq('id', payload.id)
      .select('id, full_name, phone, is_active')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Driver updated successfully',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Cannot update resource',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const payload = (await req.json()) as ResourcePayload
    const supabase = createClient()

    if (!payload.id || !isValidUuid(payload.id)) {
      return NextResponse.json(
        { error: `Invalid id: ${payload.id}` },
        { status: 400 },
      )
    }

    if (payload.resourceType === 'vehicle') {
      const { data: inUseAssignments, error: inUseError } = await supabase
        .from('assignments')
        .select('id, booking_code')
        .eq('vehicle_id', payload.id)
        .limit(5)

      if (inUseError) {
        return NextResponse.json({ error: inUseError.message }, { status: 500 })
      }

      if (inUseAssignments && inUseAssignments.length > 0) {
        return NextResponse.json(
          {
            error: `Vehicle is being used by assignments: ${inUseAssignments
              .map((item) => item.booking_code || item.id)
              .join(', ')}`,
          },
          { status: 409 },
        )
      }

      const { error } = await supabase.from('vehicles').delete().eq('id', payload.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Vehicle deleted successfully',
      })
    }

    const { data: inUseAssignments, error: inUseError } = await supabase
      .from('assignments')
      .select('id, booking_code')
      .eq('driver_id', payload.id)
      .limit(5)

    if (inUseError) {
      return NextResponse.json({ error: inUseError.message }, { status: 500 })
    }

    if (inUseAssignments && inUseAssignments.length > 0) {
      return NextResponse.json(
        {
          error: `Driver is being used by assignments: ${inUseAssignments
            .map((item) => item.booking_code || item.id)
            .join(', ')}`,
        },
        { status: 409 },
      )
    }

    const { error } = await supabase.from('drivers').delete().eq('id', payload.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Driver deleted successfully',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Cannot delete resource',
      },
      { status: 500 },
    )
  }
}