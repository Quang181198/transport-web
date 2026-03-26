import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import type { AssignmentStatus } from '../../../../lib/types/transport'
import { isValidUuid } from '../../../../lib/pdf/pdf-utils'

type AssignmentUpdatePayload = {
  vehicle_id?: string | null
  driver_id?: string | null
  status?: AssignmentStatus | null
  start_datetime?: string | null
  end_datetime?: string | null
}

type OverlapAssignmentRow = {
  booking_code: string
  start_date: string | null
  end_date: string | null
  start_datetime: string | null
  end_datetime: string | null
}

const ALLOWED_STATUSES: AssignmentStatus[] = [
  'pending',
  'confirmed',
  'assigned',
  'in_progress',
  'completed',
  'canceled',
]

function hasOwnKey<T extends object>(obj: T, key: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function buildDateTime(date: string | null | undefined, isEnd: boolean) {
  if (!date) return null
  return `${date}T${isEnd ? '23:59:59' : '00:00:00'}`
}

function getDatePart(value: string | null | undefined) {
  return value ? value.slice(0, 10) : null
}

function getEffectiveAssignmentStart(assignment: {
  start_datetime?: string | null
  start_date?: string | null
}) {
  return assignment.start_datetime || buildDateTime(assignment.start_date, false)
}

function getEffectiveAssignmentEnd(assignment: {
  end_datetime?: string | null
  end_date?: string | null
  start_date?: string | null
}) {
  return (
    assignment.end_datetime ||
    buildDateTime(assignment.end_date || assignment.start_date, true)
  )
}

function hasStrictOverlap(
  aStart: string | null | undefined,
  aEnd: string | null | undefined,
  bStart: string | null | undefined,
  bEnd: string | null | undefined,
) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false
  return aStart < bEnd && aEnd > bStart
}

function isValidIsoDateTime(value: string) {
  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

function formatDateVN(value?: string | null) {
  if (!value) return '-'
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

function formatDateTimeVN(value?: string | null) {
  if (!value) return '-'

  const normalized = value.replace(' ', 'T')
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(normalized)

  if (!match) return value

  const [, year, month, day, hour, minute] = match
  return `${day}/${month}/${year} ${hour}:${minute}`
}

function formatOverlapRange(row: OverlapAssignmentRow) {
  const start = row.start_datetime || buildDateTime(row.start_date, false)
  const end = row.end_datetime || buildDateTime(row.end_date || row.start_date, true)

  if (start || end) {
    return `${formatDateTimeVN(start)} - ${formatDateTimeVN(end)}`
  }

  return `${formatDateVN(row.start_date)} - ${formatDateVN(row.end_date)}`
}

export async function PATCH(
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

    const payload = (await req.json()) as AssignmentUpdatePayload

    if (
      hasOwnKey(payload, 'status') &&
      payload.status !== null &&
      payload.status !== undefined &&
      !ALLOWED_STATUSES.includes(payload.status)
    ) {
      return NextResponse.json(
        {
          error: `Status không hợp lệ: ${payload.status}. Giá trị hợp lệ: ${ALLOWED_STATUSES.join(', ')}`,
        },
        { status: 400 },
      )
    }

    const supabase = createClient()

    const { data: currentAssignment, error: currentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single()

    if (currentError || !currentAssignment) {
      return NextResponse.json(
        { error: currentError?.message || 'Không tìm thấy assignment' },
        { status: 404 },
      )
    }

    if (
      currentAssignment.status === 'in_progress' ||
      currentAssignment.status === 'completed' ||
      currentAssignment.status === 'canceled'
    ) {
      if (hasOwnKey(payload, 'start_datetime') || hasOwnKey(payload, 'end_datetime')) {
        return NextResponse.json(
          { error: 'Không được thay đổi thời gian với đơn đã in_progress, completed hoặc canceled' },
          { status: 400 },
        )
      }
    }

    let nextStart = getEffectiveAssignmentStart(currentAssignment)
    let nextEnd = getEffectiveAssignmentEnd(currentAssignment)

    if (hasOwnKey(payload, 'start_datetime')) {
      if (payload.start_datetime) {
        if (!isValidIsoDateTime(payload.start_datetime)) {
          return NextResponse.json(
            { error: 'start_datetime không hợp lệ' },
            { status: 400 },
          )
        }
        nextStart = payload.start_datetime
      } else {
        return NextResponse.json(
          { error: 'start_datetime không được để trống khi cập nhật thời gian' },
          { status: 400 },
        )
      }
    }

    if (hasOwnKey(payload, 'end_datetime')) {
      if (payload.end_datetime) {
        if (!isValidIsoDateTime(payload.end_datetime)) {
          return NextResponse.json(
            { error: 'end_datetime không hợp lệ' },
            { status: 400 },
          )
        }
        nextEnd = payload.end_datetime
      } else {
        return NextResponse.json(
          { error: 'end_datetime không được để trống khi cập nhật thời gian' },
          { status: 400 },
        )
      }
    }

    if (!nextStart || !nextEnd) {
      return NextResponse.json(
        { error: 'Assignment hiện tại chưa có khoảng thời gian điều hành hợp lệ' },
        { status: 400 },
      )
    }

    if (nextStart >= nextEnd) {
      return NextResponse.json(
        { error: 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu' },
        { status: 400 },
      )
    }

    let nextVehicleId = currentAssignment.vehicle_id as string | null
    let nextDriverId = currentAssignment.driver_id as string | null
    let nextVehicleAssigned = currentAssignment.vehicle_assigned as string | null
    let nextDriverAssigned = currentAssignment.driver_assigned as string | null
    let nextStatus = (currentAssignment.status || 'pending') as AssignmentStatus

    if (hasOwnKey(payload, 'vehicle_id')) {
      if (payload.vehicle_id) {
        const { data: vehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id, plate_number, is_active')
          .eq('id', payload.vehicle_id)
          .eq('is_active', true)
          .single()

        if (vehicleError || !vehicle) {
          return NextResponse.json(
            { error: vehicleError?.message || 'Không tìm thấy xe đang hoạt động' },
            { status: 400 },
          )
        }

        nextVehicleId = vehicle.id
        nextVehicleAssigned = vehicle.plate_number
      } else {
        nextVehicleId = null
        nextVehicleAssigned = null
      }
    }

    if (hasOwnKey(payload, 'driver_id')) {
      if (payload.driver_id) {
        const { data: driver, error: driverError } = await supabase
          .from('drivers')
          .select('id, full_name, is_active')
          .eq('id', payload.driver_id)
          .eq('is_active', true)
          .single()

        if (driverError || !driver) {
          return NextResponse.json(
            { error: driverError?.message || 'Không tìm thấy lái xe đang hoạt động' },
            { status: 400 },
          )
        }

        nextDriverId = driver.id
        nextDriverAssigned = driver.full_name
      } else {
        nextDriverId = null
        nextDriverAssigned = null
      }
    }

    if (hasOwnKey(payload, 'status') && payload.status) {
      nextStatus = payload.status
    }

    const warnings: string[] = []

    if (nextVehicleId) {
      const { data: candidateVehicleAssignments, error: overlapVehicleError } = await supabase
        .from('assignments')
        .select('booking_code, start_date, end_date, start_datetime, end_datetime')
        .neq('id', id)
        .eq('vehicle_id', nextVehicleId)
        .neq('status', 'canceled')
        .order('start_datetime', { ascending: true })
        .order('start_date', { ascending: true })

      if (overlapVehicleError) {
        return NextResponse.json(
          { error: overlapVehicleError.message },
          { status: 500 },
        )
      }

      const strictVehicleOverlaps = ((candidateVehicleAssignments ?? []) as OverlapAssignmentRow[]).filter(
        (row) => {
          const rowStart = row.start_datetime || buildDateTime(row.start_date, false)
          const rowEnd = row.end_datetime || buildDateTime(row.end_date || row.start_date, true)

          return hasStrictOverlap(nextStart, nextEnd, rowStart, rowEnd)
        },
      )

      if (strictVehicleOverlaps.length > 0) {
        warnings.push(
          `Xe đang bị trùng lịch với: ${strictVehicleOverlaps
            .map((x) => `${x.booking_code} (${formatOverlapRange(x)})`)
            .join(', ')}`,
        )
      }
    }

    if (nextDriverId) {
      const { data: candidateDriverAssignments, error: overlapDriverError } = await supabase
        .from('assignments')
        .select('booking_code, start_date, end_date, start_datetime, end_datetime')
        .neq('id', id)
        .eq('driver_id', nextDriverId)
        .neq('status', 'cancelled')
        .order('start_datetime', { ascending: true })
        .order('start_date', { ascending: true })

      if (overlapDriverError) {
        return NextResponse.json(
          { error: overlapDriverError.message },
          { status: 500 },
        )
      }

      const strictDriverOverlaps = ((candidateDriverAssignments ?? []) as OverlapAssignmentRow[]).filter(
        (row) => {
          const rowStart = row.start_datetime || buildDateTime(row.start_date, false)
          const rowEnd = row.end_datetime || buildDateTime(row.end_date || row.start_date, true)

          return hasStrictOverlap(nextStart, nextEnd, rowStart, rowEnd)
        },
      )

      if (strictDriverOverlaps.length > 0) {
        warnings.push(
          `Lái xe đang bị trùng lịch với: ${strictDriverOverlaps
            .map((x) => `${x.booking_code} (${formatOverlapRange(x)})`)
            .join(', ')}`,
        )
      }
    }

    const { data, error } = await supabase
      .from('assignments')
      .update({
        booking_code: currentAssignment.booking_code,
        group_name: currentAssignment.group_name,
        start_date: getDatePart(nextStart),
        end_date: getDatePart(nextEnd),
        start_datetime: nextStart,
        end_datetime: nextEnd,
        vehicle_id: nextVehicleId,
        driver_id: nextDriverId,
        vehicle_assigned: nextVehicleAssigned,
        driver_assigned: nextDriverAssigned,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      warnings,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Không thể cập nhật assignment',
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
        { error: `Assignment id không hợp lệ: ${id}` },
        { status: 400 },
      )
    }

    const supabase = createClient()

    const { data: currentAssignment, error: currentError } = await supabase
      .from('assignments')
      .select('id, booking_id, quotation_pdf_path')
      .eq('id', id)
      .single()

    if (currentError || !currentAssignment) {
      return NextResponse.json(
        { error: currentError?.message || 'Không tìm thấy assignment' },
        { status: 404 },
      )
    }

    if (!currentAssignment.booking_id) {
      const { error: assignmentDeleteError } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id)

      if (assignmentDeleteError) {
        return NextResponse.json(
          { error: assignmentDeleteError.message },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        mode: 'assignment-only',
        message: 'Đã xóa assignment không có booking_id',
      })
    }

    const bookingId = currentAssignment.booking_id

    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, quotation_pdf_path')
      .eq('booking_id', bookingId)

    if (assignmentsError) {
      return NextResponse.json(
        { error: `Không thể đọc assignments: ${assignmentsError.message}` },
        { status: 500 },
      )
    }

    const { data: quotations, error: quotationsError } = await supabase
      .from('quotations')
      .select('id, pdf_path')
      .eq('booking_id', bookingId)

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
          { error: `Xóa file PDF thất bại: ${storageDeleteError.message}` },
          { status: 500 },
        )
      }
    }

    const { error: quotationDeleteError } = await supabase
      .from('quotations')
      .delete()
      .eq('booking_id', bookingId)

    if (quotationDeleteError) {
      return NextResponse.json(
        { error: `Xóa row quotations thất bại: ${quotationDeleteError.message}` },
        { status: 500 },
      )
    }

    const { error: assignmentDeleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('booking_id', bookingId)

    if (assignmentDeleteError) {
      return NextResponse.json(
        { error: `Xóa assignments thất bại: ${assignmentDeleteError.message}` },
        { status: 500 },
      )
    }

    const { error: legsDeleteError } = await supabase
      .from('itinerary_legs')
      .delete()
      .eq('booking_id', bookingId)

    if (legsDeleteError) {
      return NextResponse.json(
        { error: `Xóa itinerary_legs thất bại: ${legsDeleteError.message}` },
        { status: 500 },
      )
    }

    const { error: bookingDeleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId)

    if (bookingDeleteError) {
      return NextResponse.json(
        { error: `Xóa booking thất bại: ${bookingDeleteError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      mode: 'cascade-from-assignment',
      bookingId,
      deleted: {
        quotations: (quotations ?? []).length,
        assignments: (assignments ?? []).length,
        files: allPdfPaths.length,
      },
      message: 'Đã xóa booking gốc và toàn bộ dữ liệu liên quan từ nút Xóa đơn',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Không thể xóa assignment',
      },
      { status: 500 },
    )
  }
}