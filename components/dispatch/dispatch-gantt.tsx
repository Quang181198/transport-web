'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AssignmentStatus,
  AssignmentWithLegs,
  DriverRecord,
  VehicleRecord,
} from '@/lib/types/transport'

type ConflictInfo = {
  hasConflict: boolean
  messages: string[]
}

type VisibleDay = {
  date: string
  label: string
}

type DragMode = 'move' | 'resize-start' | 'resize-end'

type DragState = {
  assignmentId: string
  mode: DragMode
  originX: number
  initialStart: string
  initialEnd: string
  previewStart: string
  previewEnd: string
}

function getDaysInMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const days = new Date(year, monthNumber, 0).getDate()
  return Array.from({ length: days }, (_, i) => i + 1)
}

function getVisibleDays(month: string): VisibleDay[] {
  return getDaysInMonth(month).map((day) => {
    const date = `${month}-${String(day).padStart(2, '0')}`
    return {
      date,
      label: String(day),
    }
  })
}

function formatDateTimeVN(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function getRoundedDurationHours(start?: string | null, end?: string | null) {
  if (!start || !end) return '-'

  const startDate = new Date(start)
  const endDate = new Date(end)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return '-'
  }

  const rawHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  if (rawHours <= 0) return '-'

  const rounded = Math.round(rawHours)
  const days = Math.floor(rounded / 24)
  const hours = rounded % 24

  if (days === 0) return `${hours} giờ`
  if (hours === 0) return `${days} ngày`

  return `${days} ngày ${hours} giờ`
}

function getMonthRange(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const firstDate = `${month}-01`
  const lastDay = new Date(year, monthNumber, 0).getDate()
  const lastDate = `${month}-${String(lastDay).padStart(2, '0')}`

  return {
    firstDate,
    lastDate,
    firstDateTime: `${firstDate}T00:00:00`,
    lastDateTime: `${lastDate}T23:59:59`,
  }
}

function parseDateTime(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function overlaps(
  aStart?: string | null,
  aEnd?: string | null,
  bStart?: string | null,
  bEnd?: string | null,
) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false
  return aStart < bEnd && aEnd > bStart
}

function addMinutes(value: string, minutes: number) {
  const date = new Date(value)
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString().slice(0, 19)
}

function diffMinutes(a: string, b: string) {
  const aDate = new Date(a)
  const bDate = new Date(b)
  return Math.round((aDate.getTime() - bDate.getTime()) / (1000 * 60))
}

function clampDateTime(value: string, min: string, max: string) {
  if (value < min) return min
  if (value > max) return max
  return value
}

function roundToNearestSlot(dateTime: string, slotMinutes: number) {
  const date = new Date(dateTime)
  const minutes = date.getMinutes()
  const rounded = Math.round(minutes / slotMinutes) * slotMinutes
  date.setMinutes(rounded, 0, 0)
  return date.toISOString().slice(0, 19)
}

function getClampedLayout(
  start: string,
  end: string,
  month: string,
  dayColumnWidth: number,
) {
  const { firstDateTime, lastDateTime, firstDate } = getMonthRange(month)

  const clampedStart = start < firstDateTime ? firstDateTime : start
  const clampedEnd = end > lastDateTime ? lastDateTime : end

  const startDateObj = parseDateTime(clampedStart)
  const endDateObj = parseDateTime(clampedEnd)
  const visibleMonthStart = parseDateTime(`${firstDate}T00:00:00`)

  if (!startDateObj || !endDateObj || !visibleMonthStart) {
    return { left: 4, width: dayColumnWidth - 8 }
  }

  const hoursFromMonthStart =
    (startDateObj.getTime() - visibleMonthStart.getTime()) / (1000 * 60 * 60)

  const durationHours = Math.max(
    (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60),
    0.5,
  )

  const hoursPerDay = 24
  const hourWidth = dayColumnWidth / hoursPerDay

  const left = Math.max(hoursFromMonthStart * hourWidth + 4, 4)
  const width = Math.max(durationHours * hourWidth - 8, 24)

  return { left, width }
}

function getVehicleTypeColor(vehicleType?: string | null) {
  switch ((vehicleType || '').trim()) {
    case '5':
      return '#ec4899'
    case '7':
      return '#3b82f6'
    case '9':
      return '#06b6d4'
    case '16':
      return '#10b981'
    case '29':
      return '#f59e0b'
    case '45':
      return '#8b5cf6'
    default:
      return '#94a3b8'
  }
}

function getVehicleTypeLabel(vehicleType?: string | null) {
  switch ((vehicleType || '').trim()) {
    case '5':
      return '5 chỗ'
    case '7':
      return '7 chỗ'
    case '9':
      return '9 chỗ'
    case '16':
      return '16 chỗ'
    case '29':
      return '29 chỗ'
    case '45':
      return '45 chỗ'
    default:
      return 'Khác / chưa rõ'
  }
}

const VEHICLE_TYPE_LEGEND = [
  { value: '5', label: '5 chỗ' },
  { value: '7', label: '7 chỗ' },
  { value: '9', label: '9 chỗ' },
  { value: '16', label: '16 chỗ' },
  { value: '29', label: '29 chỗ' },
  { value: '45', label: '45 chỗ' },
  { value: 'other', label: 'Khác / chưa rõ' },
]

export default function DispatchGantt({ month }: { month: string }) {
  const [data, setData] = useState<AssignmentWithLegs[]>([])
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([])
  const [drivers, setDrivers] = useState<DriverRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState('')
  const [saving, setSaving] = useState(false)
  const [dispatchOrderLoading, setDispatchOrderLoading] = useState(false)
  const [dragState, setDragState] = useState<DragState | null>(null)

  const [vehicleIdInput, setVehicleIdInput] = useState('')
  const [driverIdInput, setDriverIdInput] = useState('')
  const [statusInput, setStatusInput] = useState<AssignmentStatus>('pending')
  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([])

  const visibleDays = useMemo(() => getVisibleDays(month), [month])
  const leftColumnWidth = 180
  const dayColumnWidth = 96
  const rowHeight = 64
  const slotMinutes = 30
  const minutesPerDay = 24 * 60
  const pixelsPerMinute = dayColumnWidth / minutesPerDay
  const ganttContentWidth = leftColumnWidth + visibleDays.length * dayColumnWidth

  const mainScrollRef = useRef<HTMLDivElement | null>(null)
  const stickyScrollRef = useRef<HTMLDivElement | null>(null)
  const syncingScrollRef = useRef<'main' | 'sticky' | null>(null)

  const selected = useMemo(
    () => data.find((item) => item.id === selectedId) ?? null,
    [data, selectedId],
  )

  const loadAssignments = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true)
        }

        setErrorText('')

        const res = await fetch(`/api/dispatch?month=${month}`, {
          cache: 'no-store',
        })
        const json = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(json?.error || 'Không thể tải dữ liệu điều hành')
        }

        const nextData: AssignmentWithLegs[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : []

        setData(nextData)
      } catch (error) {
        console.error(error)
        setData([])
        setErrorText(
          error instanceof Error ? error.message : 'Lỗi tải dữ liệu điều hành',
        )
      } finally {
        if (showLoading) {
          setLoading(false)
        }
      }
    },
    [month],
  )

  const loadResources = useCallback(async () => {
    try {
      const res = await fetch('/api/dispatch/resources', {
        cache: 'no-store',
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Không thể tải danh sách xe/lái xe')
      }

      setVehicles(Array.isArray(json?.vehicles) ? json.vehicles : [])
      setDrivers(Array.isArray(json?.drivers) ? json.drivers : [])
    } catch (error) {
      console.error(error)
      setVehicles([])
      setDrivers([])
      setErrorText(
        error instanceof Error
          ? error.message
          : 'Không thể tải danh sách xe/lái xe',
      )
    }
  }, [])

  useEffect(() => {
    loadAssignments(true)
    loadResources()
  }, [loadAssignments, loadResources])

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadAssignments(false)
    }, 10000)

    return () => window.clearInterval(timer)
  }, [loadAssignments])

  useEffect(() => {
    if (!selected) {
      setVehicleIdInput('')
      setDriverIdInput('')
      setStatusInput('pending')
      setDuplicateWarnings([])
      return
    }

    setVehicleIdInput(selected.vehicle_id || '')
    setDriverIdInput(selected.driver_id || '')
    setStatusInput(selected.status || 'pending')
  }, [selected])

  useEffect(() => {
    if (!selectedId) return
    const stillExists = data.some((item) => item.id === selectedId)
    if (!stillExists) {
      setSelectedId(null)
      setDuplicateWarnings([])
    }
  }, [data, selectedId])

  const previewMap = useMemo(() => {
    const map = new Map<string, { start: string; end: string }>()
    if (dragState) {
      map.set(dragState.assignmentId, {
        start: dragState.previewStart,
        end: dragState.previewEnd,
      })
    }
    return map
  }, [dragState])

  const conflictMap = useMemo(() => {
    const map = new Map<string, ConflictInfo>()

    data.forEach((item) => {
      map.set(item.id, { hasConflict: false, messages: [] })
    })

    const withPreview = data.map((item) => {
      const preview = previewMap.get(item.id)
      return {
        ...item,
        _start: preview?.start || item.start_datetime || `${item.start_date}T00:00:00`,
        _end:
          preview?.end ||
          item.end_datetime ||
          `${item.end_date || item.start_date}T23:59:59`,
      }
    })

    for (let i = 0; i < withPreview.length; i += 1) {
      for (let j = i + 1; j < withPreview.length; j += 1) {
        const a = withPreview[i]
        const b = withPreview[j]

        if (
          a.status === 'canceled' ||
          b.status === 'canceled' ||
          !overlaps(a._start, a._end, b._start, b._end)
        ) {
          continue
        }

        const messagesA: string[] = []
        const messagesB: string[] = []

        if (a.vehicle_id && b.vehicle_id && a.vehicle_id === b.vehicle_id) {
          messagesA.push(`Trùng xe với ${b.booking_code}`)
          messagesB.push(`Trùng xe với ${a.booking_code}`)
        }

        if (a.driver_id && b.driver_id && a.driver_id === b.driver_id) {
          messagesA.push(`Trùng lái xe với ${b.booking_code}`)
          messagesB.push(`Trùng lái xe với ${a.booking_code}`)
        }

        if (messagesA.length > 0) {
          const currentA = map.get(a.id) || { hasConflict: false, messages: [] }
          currentA.hasConflict = true
          currentA.messages.push(...messagesA)
          map.set(a.id, currentA)
        }

        if (messagesB.length > 0) {
          const currentB = map.get(b.id) || { hasConflict: false, messages: [] }
          currentB.hasConflict = true
          currentB.messages.push(...messagesB)
          map.set(b.id, currentB)
        }
      }
    }

    for (const [key, value] of map.entries()) {
      map.set(key, {
        hasConflict: value.hasConflict,
        messages: Array.from(new Set(value.messages)),
      })
    }

    return map
  }, [data, previewMap])

  const selectedWarnings = useMemo(() => {
    if (!selected) return []
    const combined = [
      ...(conflictMap.get(selected.id)?.messages || []),
      ...duplicateWarnings,
    ]
    return Array.from(new Set(combined))
  }, [selected, conflictMap, duplicateWarnings])

  const canDragAssignment = useCallback((assignment: AssignmentWithLegs) => {
    return (
      assignment.status !== 'in_progress' &&
      assignment.status !== 'completed' &&
      assignment.status !== 'canceled'
    )
  }, [])

  const startDrag = useCallback(
    (
      event: React.MouseEvent,
      assignment: AssignmentWithLegs,
      mode: DragMode,
    ) => {
      if (!canDragAssignment(assignment)) return

      event.preventDefault()
      event.stopPropagation()

      const start = assignment.start_datetime || `${assignment.start_date}T00:00:00`
      const end =
        assignment.end_datetime || `${assignment.end_date || assignment.start_date}T23:59:59`

      setDuplicateWarnings([])
      setDragState({
        assignmentId: assignment.id,
        mode,
        originX: event.clientX,
        initialStart: start,
        initialEnd: end,
        previewStart: start,
        previewEnd: end,
      })
    },
    [canDragAssignment],
  )

  useEffect(() => {
    if (!dragState) return

    const currentDrag = dragState

    function onMouseMove(event: MouseEvent) {
      const deltaX = event.clientX - currentDrag.originX
      const rawDeltaMinutes = deltaX / pixelsPerMinute
      const snappedDeltaMinutes = Math.round(rawDeltaMinutes / slotMinutes) * slotMinutes

      const monthRange = getMonthRange(month)
      const minBoundary = monthRange.firstDateTime
      const maxBoundary = monthRange.lastDateTime

      if (currentDrag.mode === 'move') {
        let nextStart = addMinutes(currentDrag.initialStart, snappedDeltaMinutes)
        let nextEnd = addMinutes(currentDrag.initialEnd, snappedDeltaMinutes)

        const duration = diffMinutes(currentDrag.initialEnd, currentDrag.initialStart)

        if (nextStart < minBoundary) {
          nextStart = minBoundary
          nextEnd = addMinutes(nextStart, duration)
        }

        if (nextEnd > maxBoundary) {
          nextEnd = maxBoundary
          nextStart = addMinutes(nextEnd, -duration)
        }

        setDragState((prev) =>
          prev
            ? {
                ...prev,
                previewStart: roundToNearestSlot(nextStart, slotMinutes),
                previewEnd: roundToNearestSlot(nextEnd, slotMinutes),
              }
            : prev,
        )
        return
      }

      if (currentDrag.mode === 'resize-start') {
        let nextStart = addMinutes(currentDrag.initialStart, snappedDeltaMinutes)
        nextStart = clampDateTime(nextStart, minBoundary, currentDrag.initialEnd)

        const minEndBoundary = addMinutes(currentDrag.initialEnd, -slotMinutes)
        if (nextStart > minEndBoundary) {
          nextStart = minEndBoundary
        }

        setDragState((prev) =>
          prev
            ? {
                ...prev,
                previewStart: roundToNearestSlot(nextStart, slotMinutes),
                previewEnd: prev.previewEnd,
              }
            : prev,
        )
        return
      }

      if (currentDrag.mode === 'resize-end') {
        let nextEnd = addMinutes(currentDrag.initialEnd, snappedDeltaMinutes)
        nextEnd = clampDateTime(nextEnd, currentDrag.initialStart, maxBoundary)

        const minBoundaryFromStart = addMinutes(currentDrag.initialStart, slotMinutes)
        if (nextEnd < minBoundaryFromStart) {
          nextEnd = minBoundaryFromStart
        }

        setDragState((prev) =>
          prev
            ? {
                ...prev,
                previewStart: prev.previewStart,
                previewEnd: roundToNearestSlot(nextEnd, slotMinutes),
              }
            : prev,
        )
      }
    }

    async function onMouseUp() {
      const currentDrag = dragState
      setDragState(null)

      if (!currentDrag) {
        return
      }

      if (
        currentDrag.previewStart === currentDrag.initialStart &&
        currentDrag.previewEnd === currentDrag.initialEnd
      ) {
        return
      }

      const ok = window.confirm(
        `Xác nhận cập nhật thời gian?\n\nTừ: ${formatDateTimeVN(
          currentDrag.initialStart,
        )} → ${formatDateTimeVN(currentDrag.initialEnd)}\nThành: ${formatDateTimeVN(
          currentDrag.previewStart,
        )} → ${formatDateTimeVN(currentDrag.previewEnd)}`,
      )

      if (!ok) {
        await loadAssignments(false)
        return
      }

      try {
        setSaving(true)
        setDuplicateWarnings([])

        const res = await fetch(`/api/assignments/${currentDrag.assignmentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            start_datetime: currentDrag.previewStart,
            end_datetime: currentDrag.previewEnd,
          }),
        })

        const json = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(json?.error || 'Không thể cập nhật thời gian assignment')
        }

        setDuplicateWarnings(Array.isArray(json?.warnings) ? json.warnings : [])
        await loadAssignments(false)
      } catch (error) {
        console.error(error)
        alert(
          error instanceof Error
            ? error.message
            : 'Cập nhật thời gian điều hành thất bại',
        )
        await loadAssignments(false)
      } finally {
        setSaving(false)
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [dragState, loadAssignments, month, pixelsPerMinute, slotMinutes])

  useEffect(() => {
    const mainEl = mainScrollRef.current
    const stickyEl = stickyScrollRef.current

    if (!mainEl || !stickyEl) return

    const currentMainEl = mainEl
    const currentStickyEl = stickyEl

    function syncFromMain() {
      if (syncingScrollRef.current === 'sticky') return
      syncingScrollRef.current = 'main'
      currentStickyEl.scrollLeft = currentMainEl.scrollLeft
      window.requestAnimationFrame(() => {
        syncingScrollRef.current = null
      })
    }

    function syncFromSticky() {
      if (syncingScrollRef.current === 'main') return
      syncingScrollRef.current = 'sticky'
      currentMainEl.scrollLeft = currentStickyEl.scrollLeft
      window.requestAnimationFrame(() => {
        syncingScrollRef.current = null
      })
    }

    currentStickyEl.scrollLeft = currentMainEl.scrollLeft

    currentMainEl.addEventListener('scroll', syncFromMain, { passive: true })
    currentStickyEl.addEventListener('scroll', syncFromSticky, { passive: true })

    return () => {
      currentMainEl.removeEventListener('scroll', syncFromMain)
      currentStickyEl.removeEventListener('scroll', syncFromSticky)
    }
  }, [ganttContentWidth])

  async function deleteAssignment() {
    if (!selected?.id) {
      alert('Không tìm thấy id assignment để xóa')
      return
    }

    const ok = window.confirm(`Xóa đơn ${selected.booking_code}?`)
    if (!ok) return

    try {
      const res = await fetch(`/api/assignments/${selected.id}`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Không thể xóa đơn')
      }

      setSelectedId(null)
      setDuplicateWarnings([])
      await loadAssignments(false)
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Xóa đơn thất bại')
    }
  }

  async function saveAssignment() {
    if (!selected?.id) {
      alert('Không tìm thấy id assignment để cập nhật')
      return
    }

    try {
      setSaving(true)
      setDuplicateWarnings([])

      const res = await fetch(`/api/assignments/${selected.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicle_id: vehicleIdInput || null,
          driver_id: driverIdInput || null,
          status: statusInput,
        }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Không thể cập nhật assignment')
      }

      setDuplicateWarnings(Array.isArray(json?.warnings) ? json.warnings : [])
      await loadAssignments(false)

      if (!json?.warnings || json.warnings.length === 0) {
        alert('Đã cập nhật điều hành thành công')
      }
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Cập nhật điều xe thất bại')
    } finally {
      setSaving(false)
    }
  }

  function openDispatchOrderPdf() {
    if (!selected?.id) return

    try {
      setDispatchOrderLoading(true)
      window.open(
        `/api/assignments/${selected.id}/dispatch-order`,
        '_blank',
        'noopener,noreferrer',
      )
    } finally {
      window.setTimeout(() => {
        setDispatchOrderLoading(false)
      }, 600)
    }
  }

  const vehiclePreviewColor = getVehicleTypeColor(selected?.vehicle_type)
  const vehicleTypeLabel = getVehicleTypeLabel(selected?.vehicle_type)

  return (
    <>
      <div className="section-card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>
          Chú thích màu theo loại xe
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          {VEHICLE_TYPE_LEGEND.map((item) => (
            <div
              key={item.value}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 999,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: 13,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  background: getVehicleTypeColor(item.value === 'other' ? null : item.value),
                  display: 'inline-block',
                }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div style={{ color: '#64748b', fontSize: 13 }}>
          Double click để mở panel. Drag để đổi giờ. Thả chuột sẽ hiện xác nhận. Snap: 30 phút. Đơn in_progress/completed/canceled bị khóa.
        </div>
      </div>

      <div
        ref={mainScrollRef}
        style={{
          border: '1px solid #d8e4f0',
          borderRadius: 12,
          background: '#fff',
          overflow: 'auto',
          maxHeight: 'calc(100vh - 320px)',
          minHeight: 420,
        }}
      >
        {loading && <div style={{ padding: 16 }}>Đang tải dữ liệu điều hành...</div>}
        {!loading && errorText && (
          <div style={{ padding: 16, color: 'crimson' }}>{errorText}</div>
        )}
        {!loading && !errorText && data.length === 0 && (
          <div style={{ padding: 16 }}>Chưa có dữ liệu điều hành trong tháng này.</div>
        )}

        {!loading && !errorText && data.length > 0 && (
          <div
            style={{
              minWidth: ganttContentWidth,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `${leftColumnWidth}px repeat(${visibleDays.length}, ${dayColumnWidth}px)`,
                borderBottom: '1px solid #d8e4f0',
                position: 'sticky',
                top: 0,
                zIndex: 25,
                background: '#f8fbff',
                boxShadow: '0 6px 12px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div
                style={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 30,
                  padding: '12px 10px',
                  fontWeight: 700,
                  borderRight: '1px solid #d8e4f0',
                  background: '#eef6ff',
                  boxShadow: '6px 0 10px rgba(15, 23, 42, 0.04)',
                }}
              >
                Code đoàn
              </div>

              {visibleDays.map((day) => (
                <div
                  key={day.date}
                  style={{
                    padding: '8px 0',
                    textAlign: 'center',
                    borderRight: '1px solid #e7eef6',
                    fontSize: 12,
                    color: '#40566e',
                    background: '#f8fbff',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{day.label}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>00–24h</div>
                </div>
              ))}
            </div>

            {data.map((item, rowIndex) => {
              const preview = previewMap.get(item.id)
              const start = preview?.start || item.start_datetime || `${item.start_date}T00:00:00`
              const end =
                preview?.end || item.end_datetime || `${item.end_date || item.start_date}T23:59:59`

              const { left, width } = getClampedLayout(start, end, month, dayColumnWidth)

              const barColor = getVehicleTypeColor(item.vehicle_type)
              const label = `${item.vehicle_assigned || 'Chưa gán xe'} | ${
                item.driver_assigned || 'Chưa gán lái xe'
              }`

              const conflictInfo = conflictMap.get(item.id)
              const hasConflict = Boolean(conflictInfo?.hasConflict)
              const locked = !canDragAssignment(item)
              const isDragging = dragState?.assignmentId === item.id

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `${leftColumnWidth}px 1fr`,
                    minHeight: rowHeight,
                    borderBottom: '1px solid #e7eef6',
                  }}
                >
                  <div
                    style={{
                      position: 'sticky',
                      left: 0,
                      zIndex: isDragging ? 35 : 6,
                      padding: '10px',
                      borderRight: '1px solid #d8e4f0',
                      background: rowIndex % 2 === 0 ? '#ffffff' : '#fbfdff',
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: 700,
                      color: '#163a63',
                      boxShadow: '6px 0 10px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    {item.booking_code}
                  </div>

                  <div
                    style={{
                      position: 'relative',
                      background: rowIndex % 2 === 0 ? '#ffffff' : '#fbfdff',
                      minHeight: rowHeight,
                      zIndex: isDragging ? 30 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${visibleDays.length}, ${dayColumnWidth}px)`,
                        height: '100%',
                        position: 'absolute',
                        inset: 0,
                      }}
                    >
                      {visibleDays.map((day) => (
                        <div
                          key={day.date}
                          style={{
                            borderRight: '1px solid #eef3f8',
                            height: '100%',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              bottom: 0,
                              left: '50%',
                              width: 1,
                              background: '#f1f5f9',
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div
                      role="button"
                      tabIndex={0}
                      onDoubleClick={() => setSelectedId(item.id)}
                      onMouseDown={(e) => startDrag(e, item, 'move')}
                      style={{
                        position: 'absolute',
                        top: 14,
                        left,
                        width,
                        height: 36,
                        borderRadius: 8,
                        border: hasConflict ? '3px solid #dc2626' : 'none',
                        background: hasConflict ? '#fee2e2' : barColor,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 12,
                        padding: '0 22px',
                        textAlign: 'left',
                        cursor: locked ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        boxShadow: hasConflict
                          ? '0 0 0 2px rgba(220,38,38,0.18)'
                          : '0 4px 10px rgba(0,0,0,0.12)',
                        opacity: locked ? 0.7 : 1,
                        userSelect: 'none',
                        zIndex: isDragging ? 40 : 5,
                      }}
                      title={
                        hasConflict
                          ? `${label} | ${conflictInfo?.messages.join(' | ')}`
                          : `${label} | ${getVehicleTypeLabel(item.vehicle_type)} | ${formatDateTimeVN(
                              start,
                            )} → ${formatDateTimeVN(end)}`
                      }
                    >
                      {hasConflict ? `⚠ ${label}` : label}

                      {!locked && (
                        <>
                          <span
                            onMouseDown={(e) => startDrag(e, item, 'resize-start')}
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: 10,
                              cursor: 'ew-resize',
                              background: 'rgba(255,255,255,0.18)',
                              borderTopLeftRadius: 8,
                              borderBottomLeftRadius: 8,
                            }}
                          />
                          <span
                            onMouseDown={(e) => startDrag(e, item, 'resize-end')}
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: 0,
                              bottom: 0,
                              width: 10,
                              cursor: 'ew-resize',
                              background: 'rgba(255,255,255,0.18)',
                              borderTopRightRadius: 8,
                              borderBottomRightRadius: 8,
                            }}
                          />
                        </>
                      )}
                    </div>

                    {isDragging && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 54,
                          left,
                          background: '#0f172a',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          zIndex: 60,
                          whiteSpace: 'nowrap',
                          boxShadow: '0 8px 24px rgba(15,23,42,0.28)',
                          pointerEvents: 'none',
                        }}
                      >
                        {formatDateTimeVN(start)} → {formatDateTimeVN(end)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div
        style={{
          position: 'sticky',
          bottom: 12,
          zIndex: 40,
          marginTop: 8,
          padding: '0 2px',
        }}
      >
        <div
          ref={stickyScrollRef}
          style={{
            overflowX: 'auto',
            overflowY: 'hidden',
            border: '1px solid #d8e4f0',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.96)',
            boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
            height: 18,
          }}
        >
          <div
            style={{
              width: ganttContentWidth,
              height: 1,
            }}
          />
        </div>
      </div>

      {selected && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 420,
            height: '100vh',
            background: '#fff',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.12)',
            padding: 20,
            zIndex: 50,
            overflowY: 'auto',
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
            {selected.booking_code}
          </h2>

          <p><strong>Đoàn: </strong> {selected.group_name}</p>
          <p><strong>Bắt đầu: </strong> {formatDateTimeVN(selected.start_datetime)}</p>
          <p><strong>Kết thúc: </strong> {formatDateTimeVN(selected.end_datetime)}</p>
          <p><strong>Thời lượng: </strong> {getRoundedDurationHours(selected.start_datetime, selected.end_datetime)}</p>
          <p><strong>Loại xe: </strong> {vehicleTypeLabel}</p>
          <p><strong>Trạng thái drag: </strong> {canDragAssignment(selected) ? 'Có thể kéo' : 'Bị khóa'}</p>

          {selectedWarnings.length > 0 && (
            <div
              style={{
                marginTop: 14,
                marginBottom: 10,
                background: '#fff7ed',
                border: '1px solid #fdba74',
                color: '#9a3412',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <strong>Cảnh báo trùng lịch: </strong>
              <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                {selectedWarnings.map((warning, index) => (
                  <li key={`${selected.id}-${index}`}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Xe</label>
              <select
                value={vehicleIdInput}
                onChange={(e) => setVehicleIdInput(e.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '10px 12px',
                  background: '#fff',
                }}
              >
                <option value="">-- Chọn xe --</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate_number}
                    {vehicle.vehicle_name ? ` - ${vehicle.vehicle_name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Lái xe</label>
              <select
                value={driverIdInput}
                onChange={(e) => setDriverIdInput(e.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '10px 12px',
                  background: '#fff',
                }}
              >
                <option value="">-- Chọn lái xe --</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.full_name}
                    {driver.phone ? ` - ${driver.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Trạng thái</label>
              <select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value as AssignmentStatus)}
                style={{
                  width: '100%',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '10px 12px',
                  background: '#fff',
                }}
              >
                <option value="pending">pending</option>
                <option value="confirmed">confirmed</option>
                <option value="assigned">assigned</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
                <option value="canceled">canceled</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Màu theo loại xe</label>
              <div
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: vehiclePreviewColor,
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'grid', gap: 10 }}>
            <button
              type="button"
              onClick={saveAssignment}
              disabled={saving}
              style={{
                background: '#16a34a',
                color: '#fff',
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                fontWeight: 600,
              }}
            >
              {saving ? 'Đang lưu...' : 'Lưu điều hành'}
            </button>

            <button
              type="button"
              onClick={openDispatchOrderPdf}
              disabled={dispatchOrderLoading}
              style={{
                background: '#0f766e',
                color: '#fff',
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                fontWeight: 600,
              }}
            >
              {dispatchOrderLoading ? 'Đang mở PDF...' : 'In Lệnh Điều Xe'}
            </button>

            <button
              type="button"
              onClick={deleteAssignment}
              style={{
                background: '#dc2626',
                color: '#fff',
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                fontWeight: 600,
              }}
            >
              Xóa đơn
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedId(null)
                setDuplicateWarnings([])
              }}
              style={{
                background: '#fff',
                color: '#0f172a',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  )
}