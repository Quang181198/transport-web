'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import ItineraryLegsTable, { Leg } from './itinerary-legs-table'
import { formatVND, parseVND } from '@/components/utils/currency'
import type {
  BookingCreatePayload,
  BookingSource,
  PartnerCompanyRecord,
} from '../../lib/types/transport'

type SaveBookingResult = {
  success: true
  bookingId: string
  assignmentId: string
}

type ServicePackageListItem = {
  id: string
  name: string
  category: string
  durationDays: number
  vehicleType: string
  isActive: boolean
}

type ServicePackageLeg = {
  id: string
  seqNo: number
  dayNo: number
  pickupTime: string
  dropoffTime: string
  itinerary: string
  distanceKm: number
  note: string
  extraAmount: number
}

type ServicePackageDetail = {
  id: string
  name: string
  category: string
  durationDays: number
  vehicleType: string
  isActive: boolean
  legs: ServicePackageLeg[]
}

function formatDateVN(value: string) {
  if (!value) return ''

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value

  const [, year, month, day] = match
  return `${day}/${month}/${year}`
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

function addDays(baseDate: string, daysToAdd: number) {
  if (!baseDate) return ''
  const date = new Date(`${baseDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + daysToAdd)
  return date.toISOString().slice(0, 10)
}

function getCategoryLabel(category?: string) {
  switch ((category || '').trim()) {
    case 'du_lich':
      return 'Du lịch'
    case 'mien_bac':
      return 'Miền Bắc'
    case 'dong_tay_bac':
      return 'Đông / Tây Bắc'
    case 'du_lich_lao':
      return 'Du lịch Lào'
    case 'du_lich_bien':
      return 'Du lịch biển'
    default:
      return category?.trim() || '-'
  }
}

function buildPayload(input: {
  bookingCode: string
  groupName: string
  email: string
  phone: string
  passengerCount: number
  vehicleType: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  pickupLocation: string
  dropoffLocation: string
  unitPrice: number
  notes: string
  totalKm: number
  totalExtra: number
  totalAmount: number
  bookingSource: BookingSource
  partnerCompanyId: string
  legs: Leg[]
}): BookingCreatePayload {
  return {
    bookingCode: input.bookingCode.trim(),
    groupName: input.groupName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    passengerCount: Number(input.passengerCount || 0),
    vehicleType: input.vehicleType.trim(),
    startDate: input.startDate.trim(),
    endDate: input.endDate.trim(),
    startTime: input.startTime.trim(),
    endTime: input.endTime.trim(),
    pickupLocation: input.pickupLocation.trim(),
    dropoffLocation: input.dropoffLocation.trim(),
    unitPrice: Number(input.unitPrice || 0),
    notes: input.notes.trim(),
    totalKm: Number(input.totalKm || 0),
    totalExtra: Number(input.totalExtra || 0),
    totalAmount: Number(input.totalAmount || 0),
    bookingSource: input.bookingSource,
    partnerCompanyId: input.partnerCompanyId.trim(),
    legs: input.legs.map((leg, index) => ({
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

function DatePickerDisplay({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  function openPicker() {
    if (!inputRef.current) return

    if (typeof inputRef.current.showPicker === 'function') {
      inputRef.current.showPicker()
      return
    }

    inputRef.current.focus()
    inputRef.current.click()
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        className="input"
        value={formatDateVN(value)}
        readOnly
        placeholder={placeholder}
        onClick={openPicker}
      />

      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
          bottom: 0,
          left: 0,
        }}
      />
    </div>
  )
}

export default function BookingForm() {
  const [bookingCode, setBookingCode] = useState('')
  const [groupName, setGroupName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [passengerCount, setPassengerCount] = useState(0)
  const [vehicleType, setVehicleType] = useState('16')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const [pickupLocation, setPickupLocation] = useState('')
  const [dropoffLocation, setDropoffLocation] = useState('')
  const [unitPrice, setUnitPrice] = useState(0)
  const [unitPriceInput, setUnitPriceInput] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const [bookingSource, setBookingSource] = useState<BookingSource>('direct')
  const [partnerCompanyId, setPartnerCompanyId] = useState('')
  const [partnerCompanies, setPartnerCompanies] = useState<PartnerCompanyRecord[]>([])
  const [partnerCompaniesLoading, setPartnerCompaniesLoading] = useState(false)

  const [servicePackages, setServicePackages] = useState<ServicePackageListItem[]>([])
  const [servicePackagesLoading, setServicePackagesLoading] = useState(false)
  const [serviceSearchInput, setServiceSearchInput] = useState('')
  const [serviceSearchKeyword, setServiceSearchKeyword] = useState('')
  const [selectedServicePackageId, setSelectedServicePackageId] = useState('')
  const [selectedServicePackageDetail, setSelectedServicePackageDetail] =
    useState<ServicePackageDetail | null>(null)
  const [serviceDetailLoading, setServiceDetailLoading] = useState(false)
  const [applyingTemplate, setApplyingTemplate] = useState(false)

  const [legs, setLegs] = useState<Leg[]>([createEmptyLeg(1)])

  const [lastSavedBookingId, setLastSavedBookingId] = useState<string | null>(null)
  const [lastSavedAssignmentId, setLastSavedAssignmentId] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const timeOptions = getTimeOptions()

  const totalKm = useMemo(
    () => legs.reduce((sum, leg) => sum + Number(leg.distanceKm || 0), 0),
    [legs],
  )

  const totalExtra = useMemo(
    () => legs.reduce((sum, leg) => sum + Number(leg.extraAmount || 0), 0),
    [legs],
  )

  const tripAmount = useMemo(() => totalKm * unitPrice, [totalKm, unitPrice])

  const total = useMemo(() => tripAmount + totalExtra, [tripAmount, totalExtra])

  useEffect(() => {
    async function loadPartnerCompanies() {
      try {
        setPartnerCompaniesLoading(true)

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
      } finally {
        setPartnerCompaniesLoading(false)
      }
    }

    void loadPartnerCompanies()
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setServiceSearchKeyword(serviceSearchInput.trim())
    }, 300)

    return () => window.clearTimeout(timer)
  }, [serviceSearchInput])

  useEffect(() => {
    const controller = new AbortController()

    async function loadServicePackages() {
      try {
        setServicePackagesLoading(true)

        const params = new URLSearchParams()
        params.set('activeOnly', 'true')
        if (serviceSearchKeyword) {
          params.set('search', serviceSearchKeyword)
        }

        const res = await fetch(`/api/service-packages?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const json = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(json?.error || 'Không thể tải gói dịch vụ')
        }

        const nextPackages = Array.isArray(json?.data) ? json.data : []
        setServicePackages(nextPackages)

        if (
          selectedServicePackageId &&
          !nextPackages.some((item: ServicePackageListItem) => item.id === selectedServicePackageId)
        ) {
          setSelectedServicePackageId('')
          setSelectedServicePackageDetail(null)
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        console.error(error)
        setServicePackages([])
      } finally {
        if (!controller.signal.aborted) {
          setServicePackagesLoading(false)
        }
      }
    }

    void loadServicePackages()

    return () => controller.abort()
  }, [serviceSearchKeyword, selectedServicePackageId])

  useEffect(() => {
    if (!selectedServicePackageId) {
      setSelectedServicePackageDetail(null)
      return
    }

    const controller = new AbortController()

    async function loadSelectedServicePackage() {
      try {
        setServiceDetailLoading(true)

        const res = await fetch(`/api/service-packages/${selectedServicePackageId}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const json = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(json?.error || 'Không thể tải chi tiết gói dịch vụ')
        }

        setSelectedServicePackageDetail((json?.data || null) as ServicePackageDetail | null)
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        console.error(error)
        setSelectedServicePackageDetail(null)
      } finally {
        if (!controller.signal.aborted) {
          setServiceDetailLoading(false)
        }
      }
    }

    void loadSelectedServicePackage()

    return () => controller.abort()
  }, [selectedServicePackageId])

  function markDirty() {
    setHasUnsavedChanges(true)
  }

  function validateBeforeSave() {
    if (!bookingCode.trim()) return 'Vui lòng nhập code đoàn.'
    if (!groupName.trim()) return 'Vui lòng nhập tên đoàn.'
    if (startDate && endDate && startDate > endDate) {
      return 'Ngày kết thúc không được nhỏ hơn ngày khởi hành.'
    }
    if (
      startDate &&
      endDate &&
      startDate === endDate &&
      startTime &&
      endTime &&
      startTime > endTime
    ) {
      return 'Giờ kết thúc không được nhỏ hơn giờ khởi hành.'
    }
    if (bookingSource === 'partner' && !partnerCompanyId) {
      return 'Vui lòng chọn công ty đối tác.'
    }

    for (const [index, leg] of legs.entries()) {
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
        return `Vui lòng nhập ngày cho chặng ${index + 1}.`
      }

      if ((leg.pickupTime && !leg.dropoffTime) || (!leg.pickupTime && leg.dropoffTime)) {
        return `Chặng ${index + 1} phải chọn đủ giờ đón và giờ trả.`
      }

      if (leg.pickupTime && leg.dropoffTime && leg.pickupTime > leg.dropoffTime) {
        return `Giờ trả của chặng ${index + 1} không được nhỏ hơn giờ đón.`
      }
    }

    return null
  }

  async function saveBooking(): Promise<SaveBookingResult> {
    const validationError = validateBeforeSave()
    if (validationError) {
      throw new Error(validationError)
    }

    const payload = buildPayload({
      bookingCode,
      groupName,
      email,
      phone,
      passengerCount,
      vehicleType,
      startDate,
      endDate,
      startTime,
      endTime,
      pickupLocation,
      dropoffLocation,
      unitPrice,
      notes,
      totalKm,
      totalExtra,
      totalAmount: total,
      bookingSource,
      partnerCompanyId: bookingSource === 'partner' ? partnerCompanyId : '',
      legs,
    })

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(data?.error || 'Không thể lưu booking')
    }

    const result = data as SaveBookingResult

    setLastSavedBookingId(result.bookingId || null)
    setLastSavedAssignmentId(result.assignmentId || null)
    setHasUnsavedChanges(false)

    return result
  }

  async function resolveBookingForPdf() {
    if (lastSavedBookingId && lastSavedAssignmentId && !hasUnsavedChanges) {
      return {
        bookingId: lastSavedBookingId,
        assignmentId: lastSavedAssignmentId,
      }
    }

    return saveBooking()
  }

  async function applyServiceTemplate() {
    if (!selectedServicePackageDetail) {
      alert('Vui lòng chọn gói dịch vụ trước khi áp dụng lịch trình mẫu')
      return
    }

    try {
      setApplyingTemplate(true)

      const nextLegs = selectedServicePackageDetail.legs.map((item, index) => ({
        seqNo: index + 1,
        tripDate: startDate ? addDays(startDate, Math.max(item.dayNo - 1, 0)) : '',
        pickupTime: item.pickupTime || '',
        dropoffTime: item.dropoffTime || '',
        itinerary: item.itinerary || '',
        distanceKm: Number(item.distanceKm || 0),
        note: item.note || '',
        extraAmount: Number(item.extraAmount || 0),
      }))

      setLegs(nextLegs.length > 0 ? nextLegs : [createEmptyLeg(1)])

      if (selectedServicePackageDetail.vehicleType) {
        setVehicleType(selectedServicePackageDetail.vehicleType)
      }

      markDirty()
    } finally {
      setApplyingTemplate(false)
    }
  }

  async function handleGeneratePdf() {
    try {
      setPdfLoading(true)

      const saved = await resolveBookingForPdf()

      const quotationResponse = await fetch('/api/quotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: saved.bookingId,
        }),
      })

      const quotationData = await quotationResponse.json().catch(() => null)

      if (!quotationResponse.ok) {
        throw new Error(quotationData?.error || 'Không thể tạo PDF')
      }

      if (quotationData?.url) {
        window.open(quotationData.url, '_blank', 'noopener,noreferrer')
      }

      alert('Đã xuất báo giá sơ bộ thành công')
    } catch (error) {
      console.error(error)
      alert(
        error instanceof Error
          ? error.message
          : 'Tạo PDF thất bại. Kiểm tra terminal và thử lại.',
      )
    } finally {
      setPdfLoading(false)
    }
  }

  async function handleSaveBooking(e: React.FormEvent) {
    e.preventDefault()

    try {
      setSaving(true)
      await saveBooking()
      alert('Đã lưu booking vào Supabase thành công')
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Lưu booking thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="section-card" onSubmit={handleSaveBooking}>
      <h3 className="section-title">Tạo booking mới</h3>

      <div className="grid-2">
        <div className="field">
          <label className="label">Code đoàn</label>
          <input
            className="input"
            placeholder="HD-2026-001"
            value={bookingCode}
            onChange={(e) => {
              setBookingCode(e.target.value)
              markDirty()
            }}
          />
        </div>

        <div className="field">
          <label className="label">Tên đoàn</label>
          <input
            className="input"
            placeholder="Đoàn khách công ty ABC"
            value={groupName}
            onChange={(e) => {
              setGroupName(e.target.value)
              markDirty()
            }}
          />
        </div>

        <div className="field">
          <label className="label">Nguồn booking</label>
          <select
            className="select"
            value={bookingSource}
            onChange={(e) => {
              const nextSource = e.target.value as BookingSource
              setBookingSource(nextSource)
              if (nextSource !== 'partner') {
                setPartnerCompanyId('')
              }
              markDirty()
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
            value={partnerCompanyId}
            disabled={bookingSource !== 'partner' || partnerCompaniesLoading}
            onChange={(e) => {
              setPartnerCompanyId(e.target.value)
              markDirty()
            }}
          >
            <option value="">
              {bookingSource !== 'partner'
                ? '-- Không áp dụng --'
                : partnerCompaniesLoading
                  ? 'Đang tải danh sách...'
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
            placeholder="contact@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              markDirty()
            }}
          />
        </div>

        <div className="field">
          <label className="label">Số điện thoại</label>
          <input
            className="input"
            placeholder="0901234567"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              markDirty()
            }}
          />
        </div>

        <div className="field">
          <label className="label">Số khách</label>
          <input
            className="input"
            type="number"
            min={0}
            placeholder="20"
            value={passengerCount || ''}
            onChange={(e) => {
              setPassengerCount(Number(e.target.value || 0))
              markDirty()
            }}
          />
        </div>

        <div className="field">
          <label className="label">Loại xe</label>
          <select
            className="select"
            value={vehicleType}
            onChange={(e) => {
              setVehicleType(e.target.value)
              markDirty()
            }}
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
          <DatePickerDisplay
            value={startDate}
            onChange={(value) => {
              setStartDate(value)
              markDirty()
            }}
          />
        </div>

        <div className="field">
          <label className="label">Giờ khởi hành</label>
          <select
            className="select"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value)
              markDirty()
            }}
          >
            <option value="">-- Chọn giờ --</option>
            {timeOptions.map((time) => (
              <option key={`start-${time}`} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Ngày kết thúc</label>
          <DatePickerDisplay
            value={endDate}
            onChange={(value) => {
              setEndDate(value)
              markDirty()
            }}
          />
        </div>

        <div className="field">
          <label className="label">Giờ kết thúc</label>
          <select
            className="select"
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value)
              markDirty()
            }}
          >
            <option value="">-- Chọn giờ --</option>
            {timeOptions.map((time) => (
              <option key={`end-${time}`} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Điểm đón</label>
          <input
            className="input"
            placeholder="Quận 1, TP.HCM"
            value={pickupLocation}
            onChange={(e) => {
              setPickupLocation(e.target.value)
              markDirty()
            }}
          />
        </div>

        <div className="field">
          <label className="label">Điểm trả</label>
          <input
            className="input"
            placeholder="TP.HCM"
            value={dropoffLocation}
            onChange={(e) => {
              setDropoffLocation(e.target.value)
              markDirty()
            }}
          />
        </div>

        <div className="field">
          <label className="label">Đơn giá / km</label>
          <input
            className="input"
            inputMode="numeric"
            placeholder="Nhập đơn giá"
            value={unitPriceInput}
            onFocus={() => {
              if (unitPrice > 0) {
                setUnitPriceInput(String(unitPrice))
              }
            }}
            onChange={(e) => {
              const raw = e.target.value
              setUnitPriceInput(raw)
              setUnitPrice(parseVND(raw))
              markDirty()
            }}
            onBlur={() => {
              setUnitPriceInput(formatVND(unitPrice))
            }}
          />
        </div>

        <div className="field">
          <label className="label">Tổng km tự tính</label>
          <input className="input" value={totalKm} readOnly />
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 16,
          border: '1px solid #e5e7eb',
          borderRadius: 14,
          background: '#f8fafc',
          display: 'grid',
          gap: 14,
        }}
      >
        <div>
          <div className="section-title" style={{ marginBottom: 4 }}>
            Gợi ý lịch trình từ gói dịch vụ
          </div>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            Chọn gói có sẵn để đổ nhanh itinerary vào booking hiện tại.
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label className="label">Tìm gói dịch vụ</label>
            <input
              className="input"
              placeholder="Tìm theo tên gói, nhóm dịch vụ, loại xe..."
              value={serviceSearchInput}
              onChange={(e) => setServiceSearchInput(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label">Chọn gói dịch vụ</label>
            <select
              className="select"
              value={selectedServicePackageId}
              disabled={servicePackagesLoading}
              onChange={(e) => {
                setSelectedServicePackageId(e.target.value)
              }}
            >
              <option value="">
                {servicePackagesLoading ? 'Đang tải gói dịch vụ...' : '-- Chọn gói dịch vụ --'}
              </option>
              {servicePackages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedServicePackageDetail && (
          <div
            style={{
              display: 'grid',
              gap: 10,
              padding: 14,
              borderRadius: 12,
              background: '#ffffff',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontWeight: 700, color: '#0f172a' }}>
              {selectedServicePackageDetail.name}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              {getCategoryLabel(selectedServicePackageDetail.category)} •{' '}
              {selectedServicePackageDetail.durationDays} ngày • Xe gợi ý:{' '}
              {selectedServicePackageDetail.vehicleType || '-'} •{' '}
              {selectedServicePackageDetail.legs.length} chặng mẫu
            </div>
            <div style={{ fontSize: 13, color: '#475569' }}>
              Khi áp dụng, hệ thống sẽ đổ các chặng mẫu vào bảng lịch trình bên dưới. Nếu đã chọn ngày khởi hành, hệ thống sẽ tự map ngày cho từng chặng theo Day 1 / Day 2 / Day 3...
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={applyServiceTemplate}
            disabled={
              !selectedServicePackageId || !selectedServicePackageDetail || serviceDetailLoading || applyingTemplate
            }
          >
            {applyingTemplate ? 'Đang áp dụng...' : 'Áp dụng lịch trình mẫu'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <ItineraryLegsTable
          legs={legs}
          onChange={(nextLegs) => {
            setLegs(nextLegs)
            markDirty()
          }}
        />
      </div>

      <div style={{ marginTop: 20 }} className="field">
        <label className="label">Ghi chú chung</label>
        <textarea
          className="textarea"
          placeholder="Ghi chú thêm cho cả booking..."
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value)
            markDirty()
          }}
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
          <strong>Tổng tiền: </strong> {total.toLocaleString('vi-VN')} đ
        </p>
      </div>

      <div className="actions">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu booking'}
        </button>

        <button
          className="btn btn-secondary"
          type="button"
          onClick={handleGeneratePdf}
          disabled={pdfLoading}
        >
          {pdfLoading ? 'Đang xuất PDF...' : 'Lưu booking & xuất báo giá sơ bộ'}
        </button>
      </div>
    </form>
  )
}
// cache invalidate