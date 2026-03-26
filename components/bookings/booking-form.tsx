'use client'

import { useEffect, useMemo, useState } from 'react'
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

function formatDateVN(value: string) {
  if (!value) return ''

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value

  const [, year, month, day] = match
  return `${day}/${month}/${year}`
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

  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState('')
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

    loadPartnerCompanies()
  }, [])

  function markDirty() {
    setHasUnsavedChanges(true)
  }

  function resetForm() {
    setBookingCode('')
    setGroupName('')
    setEmail('')
    setPhone('')
    setPassengerCount(0)
    setVehicleType('16')
    setStartDate('')
    setEndDate('')
    setStartTime('')
    setEndTime('')
    setStartDateInput('')
    setEndDateInput('')
    setPickupLocation('')
    setDropoffLocation('')
    setUnitPrice(0)
    setUnitPriceInput('')
    setNotes('')
    setBookingSource('direct')
    setPartnerCompanyId('')
    setLegs([createEmptyLeg(1)])
    setHasUnsavedChanges(false)
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

      alert('Đã lưu booking và xuất báo giá sơ bộ thành công')
      resetForm()
      setLastSavedBookingId(null)
      setLastSavedAssignmentId(null)
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
      resetForm()
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
          <input
            className="input"
            type="text"
            placeholder="dd/mm/yyyy"
            value={startDateInput}
            onFocus={() => {
              setStartDateInput(startDate || '')
            }}
            onChange={(e) => {
              const raw = e.target.value
              setStartDateInput(raw)
              markDirty()

              const parsed = parseDateVN(raw)
              if (parsed) {
                setStartDate(parsed)
              } else if (raw.trim() === '') {
                setStartDate('')
              }
            }}
            onBlur={() => {
              setStartDateInput(formatDateVN(startDate))
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
          <input
            className="input"
            type="text"
            placeholder="dd/mm/yyyy"
            value={endDateInput}
            onFocus={() => {
              setEndDateInput(endDate || '')
            }}
            onChange={(e) => {
              const raw = e.target.value
              setEndDateInput(raw)
              markDirty()

              const parsed = parseDateVN(raw)
              if (parsed) {
                setEndDate(parsed)
              } else if (raw.trim() === '') {
                setEndDate('')
              }
            }}
            onBlur={() => {
              setEndDateInput(formatDateVN(endDate))
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