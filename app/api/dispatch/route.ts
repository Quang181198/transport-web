import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

type AssignmentRow = {
  id: string
  booking_id: string | null
  booking_code: string
  group_name: string
  start_date: string
  end_date: string
  start_datetime: string | null
  end_datetime: string | null
  vehicle_type: string | null
  vehicle_id: string | null
  driver_id: string | null
  vehicle_assigned: string | null
  driver_assigned: string | null
  status: string | null
}

function isValidMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
}

function buildDateTime(date: string | null | undefined, isEnd: boolean) {
  if (!date) return null
  return `${date}T${isEnd ? '23:59:59' : '00:00:00'}`
}

function getMonthRange(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const firstDate = `${month}-01`
  const lastDay = new Date(year, monthNumber, 0).getDate()
  const lastDate = `${month}-${String(lastDay).padStart(2, '0')}`

  return {
    firstDate: `${firstDate}T00:00:00`,
    lastDate: `${lastDate}T23:59:59`,
  }
}

function getEffectiveAssignmentStart(row: AssignmentRow) {
  return row.start_datetime || buildDateTime(row.start_date, false)
}

function getEffectiveAssignmentEnd(row: AssignmentRow) {
  return row.end_datetime || buildDateTime(row.end_date || row.start_date, true)
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const month = url.searchParams.get('month')

    if (!month) {
      return NextResponse.json({ error: 'Thiếu tham số month' }, { status: 400 })
    }

    if (!isValidMonth(month)) {
      return NextResponse.json(
        { error: `Month không hợp lệ: ${month}. Định dạng đúng là YYYY-MM` },
        { status: 400 },
      )
    }

    const { firstDate, lastDate } = getMonthRange(month)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('assignments')
      .select(
        'id, booking_id, booking_code, group_name, start_date, end_date, start_datetime, end_datetime, vehicle_type, vehicle_id, driver_id, vehicle_assigned, driver_assigned, status',
      )
      .or(
        `and(start_datetime.lte.${lastDate},end_datetime.gte.${firstDate}),and(start_datetime.is.null,start_date.lte.${month}-31,end_date.gte.${month}-01)`,
      )
      .order('start_datetime', { ascending: true })
      .order('start_date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = ((data ?? []) as AssignmentRow[]).map((row) => ({
      ...row,
      start_datetime: getEffectiveAssignmentStart(row),
      end_datetime: getEffectiveAssignmentEnd(row),
    }))

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Không thể tải dữ liệu dispatch',
      },
      { status: 500 },
    )
  }
}