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

type AccountingOverviewResponse = {
  bookings?: AccountingBookingItem[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

const PAGE_SIZE = 100

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
  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchKeyword(searchInput.trim())
      setPage(1)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)

        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('pageSize', String(PAGE_SIZE))

        if (searchKeyword) {
          params.set('search', searchKeyword)
        }

        const res = await fetch(`/api/accounting/overview?${params.toString()}`, {
          cache: 'no-store',
        })
        const json = (await res.json().catch(() => null)) as AccountingOverviewResponse | null

        setBookings(Array.isArray(json?.bookings) ? json.bookings : [])
        setTotal(Number(json?.pagination?.total || 0))
        setTotalPages(Number(json?.pagination?.totalPages || 0))
      } catch (e) {
        console.error(e)
        setBookings([])
        setTotal(0)
        setTotalPages(0)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [page, searchKeyword])

  const visibleRangeText = useMemo(() => {
    if (total === 0 || bookings.length === 0) {
      return `0 / ${total} booking`
    }

    const start = (page - 1) * PAGE_SIZE + 1
    const end = start + bookings.length - 1

    return `${start}-${end} / ${total} booking`
  }, [bookings.length, page, total])

  return (
    <div className="section-card">
      <h3 className="section-title">Danh sách booking tài chính</h3>

      <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Search code đoàn, tên đoàn, loại xe, đối tác..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ minWidth: 280, flex: '1 1 320px' }}
          />

          <button
            className="btn btn-secondary"
            onClick={() => exportBookingsToExcel(bookings)}
            disabled={loading}
          >
            Export Excel
          </button>
        </div>

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

      {loading && <div>Đang tải dữ liệu...</div>}

      {!loading && bookings.length === 0 && (
        <div className="empty-box">
          {searchKeyword ? 'Không tìm thấy dữ liệu phù hợp.' : 'Không có dữ liệu.'}
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <>
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
                {bookings.map((b) => (
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
                      <strong>{b.total_amount.toLocaleString('vi-VN')} đ</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              marginTop: 16,
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
                disabled={loading || page <= 1}
              >
                Trang trước
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={loading || totalPages === 0 || page >= totalPages}
              >
                Trang sau
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
