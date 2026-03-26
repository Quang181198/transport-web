'use client'

import { useEffect, useMemo, useState } from 'react'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

type AccountingBookingItem = {
  id: string
  booking_code: string
  group_name: string
  vehicle_type: string
  start_date: string
  end_date: string
  unit_price: number
  total_km: number
  total_extra: number
  total_amount: number
  created_at: string
  assignment_status: string
  quotation_pdf_path: string | null
  booking_source?: 'direct' | 'partner' | null
  partner_company_name?: string | null
}

function formatDateVN(value: string) {
  if (!value) return '-'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return value
  const [, y, m, d] = match
  return `${d}/${m}/${y}`
}

function getBookingSourceLabel(
  bookingSource?: 'direct' | 'partner' | null,
  partnerCompanyName?: string | null,
) {
  if (bookingSource === 'partner') {
    return partnerCompanyName
      ? `Công ty đối tác - ${partnerCompanyName}`
      : 'Công ty đối tác'
  }
  return 'Khách trực tiếp'
}

function exportBookingsToExcel(bookings: AccountingBookingItem[]) {
  const rows = bookings.map((b, i) => ({
    STT: i + 1,
    Code: b.booking_code,
    'Tên đoàn': b.group_name,
    'Nguồn booking': getBookingSourceLabel(
      b.booking_source,
      b.partner_company_name,
    ),
    'Ngày đi': formatDateVN(b.start_date),
    'Ngày về': formatDateVN(b.end_date),
    'Loại xe': b.vehicle_type,
    'Tổng KM': b.total_km,
    'Đơn giá/km': b.unit_price,
    'Phát sinh': b.total_extra,
    'Tổng tiền': b.total_amount,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bookings')

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buffer])

  saveAs(blob, 'accounting-bookings.xlsx')
}

export default function AccountingBookingsTab() {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<AccountingBookingItem[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/accounting/overview', {
          cache: 'no-store',
        })
        const json = await res.json()

        setBookings(Array.isArray(json?.bookings) ? json.bookings : [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filtered = useMemo(() => {
    const k = search.trim().toLowerCase()
    if (!k) return bookings

    return bookings.filter((b) =>
      [
        b.booking_code,
        b.group_name,
        b.vehicle_type,
        b.partner_company_name,
      ]
        .join(' ')
        .toLowerCase()
        .includes(k),
    )
  }, [bookings, search])

  return (
    <div className="section-card">
      <h3 className="section-title">Danh sách booking tài chính</h3>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          className="input"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="btn btn-secondary"
          onClick={() => exportBookingsToExcel(filtered)}
          disabled={loading}
        >
          Export Excel
        </button>
      </div>

      {loading && <div>Đang tải dữ liệu...</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-box">Không có dữ liệu.</div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Tên đoàn</th>
                <th>Nguồn</th>
                <th>Ngày đi</th>
                <th>Ngày về</th>
                <th>Loại xe</th>
                <th>Tổng KM</th>
                <th>Tổng tiền</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td>{b.booking_code}</td>
                  <td>{b.group_name}</td>
                  <td>
                    {getBookingSourceLabel(
                      b.booking_source,
                      b.partner_company_name,
                    )}
                  </td>
                  <td>{formatDateVN(b.start_date)}</td>
                  <td>{formatDateVN(b.end_date)}</td>
                  <td>{b.vehicle_type}</td>
                  <td>{b.total_km.toLocaleString('vi-VN')}</td>
                  <td>
                    <strong>
                      {b.total_amount.toLocaleString('vi-VN')} đ
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}