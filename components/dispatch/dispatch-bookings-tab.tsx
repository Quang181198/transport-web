'use client'

import { useEffect, useMemo, useState } from 'react'
import ItineraryLegsTable, {
  Leg,
} from '@/components/bookings/itinerary-legs-table'
import { formatVND, parseVND } from '@/components/utils/currency'
import type {
  BookingCreatePayload,
  BookingSource,
  PartnerCompanyRecord,
} from '@/lib/types/transport'

type BookingListItem = {
  id: string
  booking_code: string
  group_name: string
  email?: string | null
  phone?: string | null
  vehicle_type: string | null
  start_date: string | null
  end_date: string | null
  start_time?: string | null
  end_time?: string | null
  total_amount: number | null
  created_at: string | null
  assignment_id: string | null
  assignment_status: string | null
  quotation_pdf_path: string | null
  booking_source?: BookingSource | null
  partner_company_id?: string | null
  partner_company_name?: string | null
}

type BookingDetail = BookingCreatePayload & {
  id: string
  partnerCompanyName?: string
  assignmentId: string | null
  assignmentStatus: string | null
  quotationPdfPath: string | null
}

type BookingListResponse = {
  success?: boolean
  error?: string
  data?: BookingListItem[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

type Props = {
  month: string
  onOpenGanttMonth: (month: string) => void
}

const PAGE_SIZE = 50

function formatDateVN(value: string) {
  if (!value) return ''

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value

  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

function formatMonthVN(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return value

  const [year, month] = value.split('-')
  return `${month}/${year}`
}

function parseDateVN(value: string) {
  if (!value) return ''

  const trimmed = value.trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed)
  if (!match) return ''

  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

function formatTimeShort(value?: string | null) {
  if (!value) return ''
  return String(value).slice(0, 5)
}

function formatDateTimeVN(date?: string | null, time?: string | null) {
  const formattedDate = date ? formatDateVN(date) : ''
  const formattedTime = time ? formatTimeShort(time) : ''

  if (formattedDate && formattedTime) {
    return `${formattedDate} ${formattedTime}`
  }

  return formattedDate || formattedTime || '-'
}

function getTimeOptions() {
  const options: string[] = []

  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      options.push(
        `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      )
    }
  }

  return options
}

function createEmptyLeg(seqNo = 1): Leg {
  return {
    seqNo,
    tripDate: '',
    pickupTime: '',
    dropoffTime: '',
    itinerary: '',
    distanceKm: 0,
    note: '',
    extraAmount: 0,
  }
}

function emptyDetail(): BookingDetail {
  return {
    id: '',
    bookingCode: '',
    groupName: '',
    email: '',
    phone: '',
    passengerCount: 0,
    vehicleType: '16',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    pickupLocation: '',
    dropoffLocation: '',
    unitPrice: 0,
    notes: '',
    totalKm: 0,
    totalExtra: 0,
    totalAmount: 0,
    bookingSource: 'direct',
    partnerCompanyId: '',
    partnerCompanyName: '',
    assignmentId: null,
    assignmentStatus: null,
    quotationPdfPath: null,
    legs: [createEmptyLeg(1)],
  }
}

function getAssignmentStatusMeta(status: string | null) {
  const normalizedStatus = (status || 'pending').toLowerCase()

  switch (normalizedStatus) {
    case 'confirmed':
      return {
        label: 'Confirmed',
        color: '#7c3aed',
        background: '#ede9fe',
        border: '#c4b5fd',
      }
    case 'assigned':
      return {
        label: 'Assigned',
        color: '#1d4ed8',
        background: '#dbeafe',
        border: '#93c5fd',
      }
    case 'in_progress':
      return {
        label: 'In progress',
        color: '#c2410c',
        background: '#ffedd5',
        border: '#fdba74',
      }
    case 'completed':
      return {
        label: 'Completed',
        color: '#15803d',
        background: '#dcfce7',
        border: '#86efac',
      }
    case 'canceled':
    case 'cancelled':
    case 'cancel':
      return {
        label: 'Canceled',
        color: '#b91c1c',
        background: '#fee2e2',
        border: '#fca5a5',
      }
    case 'pending':
    default:
      return {
        label: 'Pending',
        color: '#475569',
        background: '#e2e8f0',
        border: '#cbd5e1',
      }
  }
}

function renderReadonlyValue(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

export default function DispatchBookingsTab({ month, onOpenGanttMonth }: Props) {
  const [list, setList] = useState<BookingListItem[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState('')
  const [page, setPage] = useState(1)
  const [totalBookings, setTotalBookings] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<BookingDetail>(emptyDetail())
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [preliminaryPdfLoading, setPreliminaryPdfLoading] = useState(false)
  const [finalPdfLoading, setFinalPdfLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState('')
  const [unitPriceInput, setUnitPriceInput] = useState('')
  const [partnerCompanies, setPartnerCompanies] = useState<PartnerCompanyRecord[]>([])

  const timeOptions = getTimeOptions()

  const totalKm = useMemo(
    () => detail.legs.reduce((sum, leg) => sum + Number(leg.distanceKm || 0), 0),
    [detail.legs],
  )

  const totalExtra = useMemo(
    () => detail.legs.reduce((sum, leg) => sum + Number(leg.extraAmount || 0), 0),
    [detail.legs],
  )

  const tripAmount = useMemo(
    () => totalKm * Number(detail.unitPrice || 0),
    [totalKm, detail.unitPrice],
  )

  const totalAmount = useMemo(() => tripAmount + totalExtra, [tripAmount, totalExtra])

  const visibleRangeText = useMemo(() => {
    if (totalBookings === 0 || list.length === 0) {
      return `0 / ${totalBookings} booking`
    }

    const start = (page - 1) * PAGE_SIZE + 1
    const end = start + list.length - 1

    return `${start}-${end} / ${totalBookings} booking`
  }, [list.length, page, totalBookings])

  async function loadPartnerCompanies() {
    try {
      const res = await fetch('/api/partner-companies', {
        cache: 'no-store',
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Không thể tải danh sách công ty đối tác')
      }

      setPartnerCompanies(Array.isArray(json?.data) ? json.data : [])
    } catch (error) {
      console.error(error)
      setPartnerCompanies([])
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchKeyword(searchInput.trim())
    }, 350)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [month, searchKeyword])

  useEffect(() => {
    const controller = new AbortController()

    async function loadBookings() {
      try {
        setLoadingList(true)
        setListError('')

        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('pageSize', String(PAGE_SIZE))
        params.set('month', month)

        if (searchKeyword) {
          params.set('search', searchKeyword)
        }

        const res = await fetch(`/api/bookings?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const json = (await res.json().catch(() => null)) as BookingListResponse | null

        if (!res.ok) {
          throw new Error(json?.error || 'Không thể tải danh sách booking')
        }

        const nextList = Array.isArray(json?.data) ? json.data : []
        const nextTotal = Number(json?.pagination?.total || 0)
        const nextTotalPages = Number(json?.pagination?.totalPages || 0)

        if (nextTotalPages > 0 && page > nextTotalPages) {
          setPage(nextTotalPages)
          return
        }

        setList(nextList)
        setTotalBookings(nextTotal)
        setTotalPages(nextTotalPages)
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return
        }

        console.error(error)
        setList([])
        setTotalBookings(0)
        setTotalPages(0)
        setListError(
          error instanceof Error ? error.message : 'Không thể tải danh sách booking',
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoadingList(false)
        }
      }
    }

    loadBookings()

    return () => controller.abort()
  }, [month, page, searchKeyword])

  useEffect(() => {
    loadPartnerCompanies()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setDetail(emptyDetail())
      setStartDateInput('')
      setEndDateInput('')
      setUnitPriceInput('')
      setIsEditing(false)
      return
    }

    async function loadBookingDetail(id: string) {
      try {
        setLoadingDetail(true)

        const res = await fetch(`/api/bookings/${id}`, {
          cache: 'no-store',
        })
        const json = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(json?.error || 'Không thể tải chi tiết booking')
        }

        const next = json?.data as BookingDetail

        setDetail({
          ...next,
          startTime: formatTimeShort(next.startTime),
          endTime: formatTimeShort(next.endTime),
          legs: next.legs?.length
            ? next.legs.map((leg) => ({
                ...leg,
                pickupTime: formatTimeShort(leg.pickupTime),
                dropoffTime: formatTimeShort(leg.dropoffTime),
              }))
            : [createEmptyLeg(1)],
        })
        setStartDateInput(formatDateVN(next.startDate || ''))
        setEndDateInput(formatDateVN(next.endDate || ''))
        setUnitPriceInput(next.unitPrice ? formatVND(next.unitPrice) : '')
        setIsEditing(false)
      } catch (error) {
        console.error(error)
        alert(error instanceof Error ? error.message : 'Không thể tải booking')
      } finally {
        setLoadingDetail(false)
      }
    }

    loadBookingDetail(selectedId)
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) return

    const stillExistsInCurrentPage = list.some((item) => item.id === selectedId)

    if (!stillExistsInCurrentPage) {
      setSelectedId(null)
      setDetail(emptyDetail())
      setStartDateInput('')
      setEndDateInput('')
      setUnitPriceInput('')
      setIsEditing(false)
    }
  }, [list, selectedId])

  function updateField<K extends keyof BookingDetail>(key: K, value: BookingDetail[K]) {
    setDetail((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  function buildPayload(): BookingCreatePayload {
    return {
      bookingCode: detail.bookingCode.trim(),
      groupName: detail.groupName.trim(),
      email: detail.email.trim(),
      phone: detail.phone.trim(),
      passengerCount: Number(detail.passengerCount || 0),
      vehicleType: detail.vehicleType.trim(),
      startDate: detail.startDate.trim(),
      endDate: detail.endDate.trim(),
      startTime: detail.startTime.trim(),
      endTime: detail.endTime.trim(),
      pickupLocation: detail.pickupLocation.trim(),
      dropoffLocation: detail.dropoffLocation.trim(),
      unitPrice: Number(detail.unitPrice || 0),
      notes: detail.notes.trim(),
      totalKm,
      totalExtra,
      totalAmount,
      bookingSource: detail.bookingSource,
      partnerCompanyId: detail.bookingSource === 'partner' ? detail.partnerCompanyId.trim() : '',
      legs: detail.legs.map((leg, index) => ({
        seqNo: index + 1,
        tripDate: leg.tripDate.trim(),
        pickupTime: leg.pickupTime.trim(),
        dropoffTime: leg.dropoffTime.trim(),
        itinerary: leg.itinerary.trim(),
        distanceKm: Number(leg.distanceKm || 0),
        note: leg.note.trim(),
        extraAmount: Number(leg.extraAmount || 0),
      })),
    }
  }

  function validateBeforeSave() {
    if (!detail.id) return 'Chưa chọn booking để cập nhật'
    if (!detail.bookingCode.trim() || !detail.groupName.trim()) {
      return 'Vui lòng nhập ít nhất code đoàn và tên đoàn'
    }

    if (detail.startDate && detail.endDate && detail.startDate > detail.endDate) {
      return 'Ngày kết thúc không được nhỏ hơn ngày khởi hành'
    }

    if (
      detail.startDate &&
      detail.endDate &&
      detail.startDate === detail.endDate &&
      detail.startTime &&
      detail.endTime &&
      detail.startTime > detail.endTime
    ) {
      return 'Giờ kết thúc không được nhỏ hơn giờ khởi hành khi cùng ngày'
    }

    if (detail.bookingSource === 'partner' && !detail.partnerCompanyId) {
      return 'Vui lòng chọn công ty đối tác'
    }

    for (const [index, leg] of detail.legs.entries()) {
      const hasAnyLegValue =
        leg.tripDate.trim() ||
        leg.pickupTime.trim() ||
        leg.dropoffTime.trim() ||
        leg.itinerary.trim() ||
        Number(leg.distanceKm || 0) > 0 ||
        leg.note.trim() ||
        Number(leg.extraAmount || 0) > 0

      if (!hasAnyLegValue) {
        continue
      }

      if (!leg.tripDate.trim()) {
        return `Chặng ${index + 1} chưa có ngày`
      }

      if ((leg.pickupTime.trim() && !leg.dropoffTime.trim()) || (!leg.pickupTime.trim() && leg.dropoffTime.trim())) {
        return `Chặng ${index + 1} phải có đủ giờ đón và giờ trả`
      }

      if (
        leg.pickupTime.trim() &&
        leg.dropoffTime.trim() &&
        leg.pickupTime > leg.dropoffTime
      ) {
        return `Giờ trả của chặng ${index + 1} không được nhỏ hơn giờ đón`
      }
    }

    return null
  }

  async function reloadCurrentPage() {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(PAGE_SIZE))
    params.set('month', month)
    if (searchKeyword) {
      params.set('search', searchKeyword)
    }

    const reloadRes = await fetch(`/api/bookings?${params.toString()}`, {
      cache: 'no-store',
    })
    const reloadJson = (await reloadRes.json().catch(() => null)) as BookingListResponse | null

    if (reloadRes.ok) {
      setList(Array.isArray(reloadJson?.data) ? reloadJson.data : [])
      setTotalBookings(Number(reloadJson?.pagination?.total || 0))
      setTotalPages(Number(reloadJson?.pagination?.totalPages || 0))
    }
  }

  async function saveBooking(options?: { silent?: boolean }) {
    const validationError = validateBeforeSave()
    if (validationError) {
      alert(validationError)
      return false
    }

    try {
      setSaving(true)

      const res = await fetch(`/api/bookings/${detail.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload()),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Không thể cập nhật booking')
      }

      await reloadCurrentPage()
      setSelectedId(detail.id)
      setIsEditing(false)

      if (!options?.silent) {
        alert('Đã cập nhật booking thành công')
      }

      return true
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Cập nhật booking thất bại')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function openPreliminaryQuotationPdf() {
    if (!detail.id) {
      alert('Chưa chọn booking để xuất báo giá sơ bộ')
      return
    }

    try {
      setPreliminaryPdfLoading(true)

      if (isEditing) {
        const saved = await saveBooking({ silent: true })
        if (!saved) {
          return
        }
      }

      const res = await fetch('/api/quotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: detail.id,
        }),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Không thể tạo báo giá sơ bộ')
      }

      if (json?.url) {
        window.open(json.url, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Không thể xuất báo giá sơ bộ')
    } finally {
      setPreliminaryPdfLoading(false)
    }
  }

  async function openFinalInvoicePdf() {
    if (!detail.assignmentId) {
      alert('Booking này chưa có assignment để xuất hóa đơn final')
      return
    }

    try {
      setFinalPdfLoading(true)

      const method = detail.quotationPdfPath ? 'GET' : 'POST'
      const res = await fetch(`/api/assignments/${detail.assignmentId}/quotation`, {
        method,
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Không thể mở / tạo hóa đơn final')
      }

      if (json?.url) {
        window.open(json.url, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Không thể xuất hóa đơn final')
    } finally {
      setFinalPdfLoading(false)
    }
  }

  async function deleteBooking() {
    if (!detail.id) {
      alert('Chưa chọn booking để xóa')
      return
    }

    const ok = window.confirm(
      `Xóa booking gốc ${detail.bookingCode}? Hệ thống sẽ xóa luôn itinerary, assignment, quotation và file PDF.`,
    )
    if (!ok) return

    try {
      setDeleting(true)

      const res = await fetch(`/api/bookings/${detail.id}`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Không thể xóa booking gốc')
      }

      setSelectedId(null)
      setDetail(emptyDetail())
      setStartDateInput('')
      setEndDateInput('')
      setUnitPriceInput('')
      setIsEditing(false)

      if (list.length === 1 && page > 1) {
        setPage((prev) => prev - 1)
      } else {
        await reloadCurrentPage()
      }

      alert('Đã xóa booking gốc và toàn bộ dữ liệu liên quan')
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Xóa booking thất bại')
    } finally {
      setDeleting(false)
    }
  }

  function openGantt() {
    const targetMonth = detail.startDate?.slice(0, 7) || detail.endDate?.slice(0, 7)
    if (!targetMonth) {
      alert('Booking chưa có ngày để mở đúng tháng trên Gantt')
      return
    }

    onOpenGanttMonth(targetMonth)
  }

  async function cancelEditing() {
    if (!detail.id) {
      setIsEditing(false)
      return
    }

    setSelectedId(detail.id)
    setIsEditing(false)
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '420px 1fr',
        gap: 20,
      }}
    >
      <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: 16,
            borderBottom: '1px solid #e7eef6',
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          Danh sách booking
        </div>

        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eef3f8',
            display: 'grid',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 13, color: '#5d748f' }}>
            Tháng đang xem: <strong>{formatMonthVN(month)}</strong>
          </div>

          <input
            className="input"
            placeholder="Search code đoàn, tên đoàn, phone, email, đối tác..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
              fontSize: 13,
              color: '#64748b',
            }}
          >
            <span>{visibleRangeText}</span>
            <span>Page size: {PAGE_SIZE}</span>
          </div>
        </div>

        {loadingList && <div style={{ padding: 16 }}>Đang tải danh sách booking...</div>}

        {!loadingList && listError && (
          <div style={{ padding: 16, color: 'crimson' }}>{listError}</div>
        )}

        {!loadingList && !listError && list.length === 0 && (
          <div style={{ padding: 16 }}>
            {searchKeyword
              ? `Không tìm thấy booking phù hợp trong tháng ${formatMonthVN(month)}.`
              : `Chưa có booking nào trong tháng ${formatMonthVN(month)}.`}
          </div>
        )}

        {!loadingList && !listError && list.length > 0 && (
          <>
            <div style={{ maxHeight: '68vh', overflowY: 'auto' }}>
              {list.map((item) => {
                const selectedRow = item.id === selectedId
                const statusMeta = getAssignmentStatusMeta(item.assignment_status)

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      borderBottom: '1px solid #eef3f8',
                      background: selectedRow ? '#eef6ff' : '#fff',
                      padding: 14,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#163a63' }}>
                      {item.booking_code}
                    </div>
                    <div style={{ marginTop: 4 }}>{item.group_name}</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#5d748f' }}>
                      {formatDateTimeVN(item.start_date, item.start_time)} →{' '}
                      {formatDateTimeVN(item.end_date, item.end_time)}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>
                      {item.booking_source === 'partner'
                        ? `Đối tác: ${item.partner_company_name || '-'}`
                        : 'Khách trực tiếp'}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          color: statusMeta.color,
                          background: statusMeta.background,
                          border: `1px solid ${statusMeta.border}`,
                        }}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                padding: 16,
                borderTop: '1px solid #eef3f8',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: 13, color: '#64748b' }}>
                Trang {totalPages === 0 ? 0 : page}/{Math.max(totalPages, 1)}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1 || loadingList}
                >
                  Trang trước
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={loadingList || totalPages === 0 || page >= totalPages}
                >
                  Trang sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="section-card">
        {!selectedId && (
          <div className="empty-box">
            Chọn một booking ở cột trái để xem chi tiết.
          </div>
        )}

        {selectedId && loadingDetail && <div>Đang tải chi tiết booking...</div>}

        {selectedId && !loadingDetail && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h3 className="section-title" style={{ marginBottom: 4 }}>
                  Chi tiết booking
                </h3>
                <div
                  style={{
                    color: '#5d748f',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>{detail.bookingCode}</span>
                  {(() => {
                    const statusMeta = getAssignmentStatusMeta(detail.assignmentStatus)

                    return (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          color: statusMeta.color,
                          background: statusMeta.background,
                          border: `1px solid ${statusMeta.border}`,
                        }}
                      >
                        {statusMeta.label}
                      </span>
                    )
                  })()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={openPreliminaryQuotationPdf}
                  disabled={preliminaryPdfLoading || saving}
                >
                  {preliminaryPdfLoading
                    ? 'Đang xuất báo giá sơ bộ...'
                    : isEditing
                      ? 'Lưu cập nhật & xuất báo giá sơ bộ'
                      : 'Xuất báo giá sơ bộ'}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={openFinalInvoicePdf}
                  disabled={finalPdfLoading}
                >
                  {finalPdfLoading
                    ? 'Đang xử lý PDF...'
                    : detail.quotationPdfPath
                      ? 'Xuất hóa đơn final'
                      : 'Tạo & xuất hóa đơn final'}
                </button>

                {!isEditing ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    Chỉnh sửa
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cancelEditing}
                  >
                    Hủy chỉnh sửa
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={deleteBooking}
                  disabled={deleting}
                >
                  {deleting ? 'Đang xóa...' : 'Xóa booking gốc'}
                </button>
              </div>
            </div>

            {!isEditing && (
              <>
                <div className="grid-2">
                  <div className="field">
                    <label className="label">Code đoàn</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {renderReadonlyValue(detail.bookingCode)}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Tên đoàn</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {renderReadonlyValue(detail.groupName)}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Nguồn booking</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {detail.bookingSource === 'partner' ? 'Công ty đối tác' : 'Khách trực tiếp'}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Công ty đối tác</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {renderReadonlyValue(detail.partnerCompanyName)}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Email</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {renderReadonlyValue(detail.email)}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Số điện thoại</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {renderReadonlyValue(detail.phone)}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Số khách</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {renderReadonlyValue(detail.passengerCount)}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Loại xe</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {renderReadonlyValue(detail.vehicleType)}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Ngày khởi hành</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {formatDateVN(detail.startDate) || '-'}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Giờ khởi hành</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {renderReadonlyValue(detail.startTime)}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Ngày kết thúc</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {formatDateVN(detail.endDate) || '-'}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Giờ kết thúc</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {renderReadonlyValue(detail.endTime)}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Điểm đón</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {renderReadonlyValue(detail.pickupLocation)}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Điểm trả</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {renderReadonlyValue(detail.dropoffLocation)}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Đơn giá / km</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {formatVND(detail.unitPrice)}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Tổng km tự tính</label>
                    <div className="input" style={{ background: '#f8fafc' }}>
                      {renderReadonlyValue(totalKm)}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <div className="section-title" style={{ marginBottom: 10 }}>
                    Lịch trình
                  </div>

                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Ngày</th>
                          <th>Giờ đón</th>
                          <th>Giờ trả</th>
                          <th>Lịch trình</th>
                          <th>Km</th>
                          <th>Ghi chú</th>
                          <th>Phát sinh thêm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.legs.length > 0 ? (
                          detail.legs.map((leg, index) => (
                            <tr key={`${detail.id}-${index}`}>
                              <td>{leg.seqNo}</td>
                              <td>{renderReadonlyValue(formatDateVN(leg.tripDate))}</td>
                              <td>{renderReadonlyValue(leg.pickupTime)}</td>
                              <td>{renderReadonlyValue(leg.dropoffTime)}</td>
                              <td>{renderReadonlyValue(leg.itinerary)}</td>
                              <td>{renderReadonlyValue(leg.distanceKm)}</td>
                              <td>{renderReadonlyValue(leg.note)}</td>
                              <td>{formatVND(leg.extraAmount)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center' }}>
                              Chưa có lịch trình
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ marginTop: 20 }} className="field">
                  <label className="label">Ghi chú chung</label>
                  <div className="textarea" style={{ background: '#f8fafc' }}>
                    {renderReadonlyValue(detail.notes)}
                  </div>
                </div>

                <div style={{ marginTop: 20 }} className="summary-box">
                  <p>
                    <strong>Tổng km: </strong> {totalKm}
                  </p>
                  <p>
                    <strong>Tiền theo km: </strong> {tripAmount.toLocaleString('vi-VN')} đ
                  </p>
                  <p>
                    <strong>Phát sinh thêm: </strong> {totalExtra.toLocaleString('vi-VN')} đ
                  </p>
                  <p>
                    <strong>Tổng tiền: </strong> {totalAmount.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </>
            )}

            {isEditing && (
              <>
                <div className="grid-2">
                  <div className="field">
                    <label className="label">Code đoàn</label>
                    <input
                      className="input"
                      value={detail.bookingCode}
                      onChange={(e) => updateField('bookingCode', e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Tên đoàn</label>
                    <input
                      className="input"
                      value={detail.groupName}
                      onChange={(e) => updateField('groupName', e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Nguồn booking</label>
                    <select
                      className="select"
                      value={detail.bookingSource}
                      onChange={(e) => {
                        const nextSource = e.target.value as BookingSource
                        updateField('bookingSource', nextSource)
                        if (nextSource !== 'partner') {
                          updateField('partnerCompanyId', '')
                          setDetail((prev) => ({
                            ...prev,
                            partnerCompanyName: '',
                          }))
                        }
                      }}
                    >
                      <option value="direct">Khách trực tiếp</option>
                      <option value="partner">Công ty đối tác</option>
                    </select>
                  </div>

                  <div className="field">
                    <label className="label">Công ty đối tác</label>
                    <select
                      className="select"
                      value={detail.partnerCompanyId}
                      disabled={detail.bookingSource !== 'partner'}
                      onChange={(e) => {
                        const nextId = e.target.value
                        const selectedPartner = partnerCompanies.find((item) => item.id === nextId)

                        updateField('partnerCompanyId', nextId)
                        setDetail((prev) => ({
                          ...prev,
                          partnerCompanyName: selectedPartner?.company_name || '',
                        }))
                      }}
                    >
                      <option value="">
                        {detail.bookingSource !== 'partner'
                          ? '-- Không áp dụng --'
                          : '-- Chọn công ty đối tác --'}
                      </option>
                      {partnerCompanies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.company_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label className="label">Email</label>
                    <input
                      className="input"
                      type="email"
                      value={detail.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Số điện thoại</label>
                    <input
                      className="input"
                      value={detail.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Số khách</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={detail.passengerCount || ''}
                      onChange={(e) =>
                        updateField('passengerCount', Number(e.target.value || 0))
                      }
                    />
                  </div>

                  <div className="field">
                    <label className="label">Loại xe</label>
                    <select
                      className="select"
                      value={detail.vehicleType}
                      onChange={(e) => updateField('vehicleType', e.target.value)}
                    >
                      <option value="5">5 chỗ</option>
                      <option value="7">7 chỗ</option>
                      <option value="9">9 chỗ</option>
                      <option value="16">16 chỗ</option>
                      <option value="29">29 chỗ</option>
                      <option value="45">45 chỗ</option>
                    </select>
                  </div>

                  <div className="field">
                    <label className="label">Ngày khởi hành</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="dd/mm/yyyy"
                      value={startDateInput}
                      onFocus={() => {
                        setStartDateInput(detail.startDate || '')
                      }}
                      onChange={(e) => {
                        const raw = e.target.value
                        setStartDateInput(raw)

                        const parsed = parseDateVN(raw)
                        if (parsed) {
                          updateField('startDate', parsed)
                        } else if (raw.trim() === '') {
                          updateField('startDate', '')
                        }
                      }}
                      onBlur={() => {
                        setStartDateInput(formatDateVN(detail.startDate))
                      }}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Giờ khởi hành</label>
                    <select
                      className="select"
                      value={detail.startTime}
                      onChange={(e) => updateField('startTime', e.target.value)}
                    >
                      <option value="">-- Chọn giờ --</option>
                      {timeOptions.map((time) => (
                        <option key={`dispatch-start-${time}`} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label className="label">Ngày kết thúc</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="dd/mm/yyyy"
                      value={endDateInput}
                      onFocus={() => {
                        setEndDateInput(detail.endDate || '')
                      }}
                      onChange={(e) => {
                        const raw = e.target.value
                        setEndDateInput(raw)

                        const parsed = parseDateVN(raw)
                        if (parsed) {
                          updateField('endDate', parsed)
                        } else if (raw.trim() === '') {
                          updateField('endDate', '')
                        }
                      }}
                      onBlur={() => {
                        setEndDateInput(formatDateVN(detail.endDate))
                      }}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Giờ kết thúc</label>
                    <select
                      className="select"
                      value={detail.endTime}
                      onChange={(e) => updateField('endTime', e.target.value)}
                    >
                      <option value="">-- Chọn giờ --</option>
                      {timeOptions.map((time) => (
                        <option key={`dispatch-end-${time}`} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label className="label">Điểm đón</label>
                    <input
                      className="input"
                      value={detail.pickupLocation}
                      onChange={(e) => updateField('pickupLocation', e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Điểm trả</label>
                    <input
                      className="input"
                      value={detail.dropoffLocation}
                      onChange={(e) => updateField('dropoffLocation', e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Đơn giá / km</label>
                    <input
                      className="input"
                      inputMode="numeric"
                      value={unitPriceInput}
                      onFocus={() => {
                        if (detail.unitPrice > 0) {
                          setUnitPriceInput(String(detail.unitPrice))
                        }
                      }}
                      onChange={(e) => {
                        const raw = e.target.value
                        setUnitPriceInput(raw)
                        updateField('unitPrice', parseVND(raw))
                      }}
                      onBlur={() => {
                        setUnitPriceInput(formatVND(detail.unitPrice))
                      }}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Tổng km tự tính</label>
                    <input className="input" value={totalKm} readOnly />
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <ItineraryLegsTable
                    legs={detail.legs}
                    onChange={(nextLegs) => updateField('legs', nextLegs)}
                  />
                </div>

                <div style={{ marginTop: 20 }} className="field">
                  <label className="label">Ghi chú chung</label>
                  <textarea
                    className="textarea"
                    value={detail.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                  />
                </div>

                <div style={{ marginTop: 20 }} className="summary-box">
                  <p>
                    <strong>Tổng km: </strong> {totalKm}
                  </p>
                  <p>
                    <strong>Tiền theo km: </strong> {tripAmount.toLocaleString('vi-VN')} đ
                  </p>
                  <p>
                    <strong>Phát sinh thêm: </strong> {totalExtra.toLocaleString('vi-VN')} đ
                  </p>
                  <p>
                    <strong>Tổng tiền: </strong> {totalAmount.toLocaleString('vi-VN')} đ
                  </p>
                </div>

                <div className="actions" style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      void saveBooking()
                    }}
                    disabled={saving}
                  >
                    {saving ? 'Đang cập nhật...' : 'Lưu cập nhật'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}