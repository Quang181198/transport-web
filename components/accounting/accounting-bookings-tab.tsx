'use client'

import { useMemo, useState } from 'react'
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

type Props = {
  bookings: AccountingBookingItem[]
  loading: boolean
}

function formatDateVN(value: string) {
  if (!value) return '-'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return value
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

function getStatusMeta(status: string) {
  switch ((status || 'pending').toLowerCase()) {
    case 'assigned':
      return {
        label: 'Assigned',
        color: '#1d4ed8',
        background: '#dbeafe',
        border: '#93c5fd',
      }
    case 'completed':
      return {
        label: 'Completed',
        color: '#15803d',
        background: '#dcfce7',
        border: '#86efac',
      }
    case 'cancelled':
    case 'cancel':
      return {
        label: 'Cancel',
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
  const rows = bookings.map((item, index) => ({
    STT: index + 1,
    'Booking Code': item.booking_code || '',
    'Group Name': item.group_name || '',
    'Booking Source': getBookingSourceLabel(
      item.booking_source,
      item.partner_company_name,
    ),
    'Start Date': formatDateVN(item.start_date),
    'End Date': formatDateVN(item.end_date),
    'Vehicle Type': item.vehicle_type || '',
    'Total KM': Number(item.total_km || 0),
    'Unit Price': Number(item.unit_price || 0),
    'Extra Amount': Number(item.total_extra || 0),
    'Total Amount': Number(item.total_amount || 0),
    'Dispatch Status': getStatusMeta(item.assignment_status).label,
    'Quotation PDF': item.quotation_pdf_path ? 'Yes' : 'No',
    'Created At': formatDateVN(item.created_at),
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)

  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 28 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounting Bookings')

  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  })

  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')

  saveAs(blob, `accounting-bookings-${yyyy}${mm}${dd}.xlsx`)
}

export default function AccountingBookingsTab({
  bookings,
  loading,
}: Props) {
  const [searchKeyword, setSearchKeyword] = useState('')

  const filteredBookings = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    if (!keyword) return bookings

    return bookings.filter((item) => {
      const haystack = [
        item.booking_code,
        item.group_name,
        item.vehicle_type,
        item.assignment_status,
        item.booking_source || '',
        item.partner_company_name || '',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(keyword)
    })
  }, [bookings, searchKeyword])

  return (
    <div className="section-card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3 className="section-title" style={{ marginBottom: 4 }}>
            Danh sách booking tài chính
          </h3>
          <div style={{ color: '#64748b', fontSize: 14 }}>
            Hiển thị booking có thông tin liên quan đến tiền, km, trạng thái, nguồn booking và báo giá.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ color: '#64748b', fontSize: 14 }}>
            Tổng booking: <strong>{loading ? '...' : filteredBookings.length}</strong>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => exportBookingsToExcel(filteredBookings)}
            disabled={loading || filteredBookings.length === 0}
          >
            Export Excel
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          className="input"
          placeholder="Search code đoàn, tên đoàn, loại xe, trạng thái, đối tác..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
      </div>

      {loading && <div>Đang tải dữ liệu kế toán...</div>}

      {!loading && filteredBookings.length === 0 && (
        <div className="empty-box">
          {searchKeyword.trim() ? 'Không tìm thấy booking phù hợp.' : 'Chưa có booking nào.'}
        </div>
      )}

      {!loading && filteredBookings.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Tên đoàn</th>
                <th>Nguồn booking</th>
                <th>Ngày đi</th>
                <th>Ngày về</th>
                <th>Loại xe</th>
                <th>Tổng km</th>
                <th>Đơn giá/km</th>
                <th>Phát sinh</th>
                <th>Tổng tiền</th>
                <th>Điều hành</th>
                <th>Báo giá</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((item) => {
                const status = getStatusMeta(item.assignment_status)

                return (
                  <tr key={item.id}>
                    <td>{item.booking_code || '-'}</td>
                    <td>{item.group_name || '-'}</td>
                    <td>
                      <div style={{ minWidth: 180 }}>
                        {getBookingSourceLabel(
                          item.booking_source,
                          item.partner_company_name,
                        )}
                      </div>
                    </td>
                    <td>{formatDateVN(item.start_date)}</td>
                    <td>{formatDateVN(item.end_date)}</td>
                    <td>{item.vehicle_type || '-'}</td>
                    <td>{Number(item.total_km || 0).toLocaleString('vi-VN')}</td>
                    <td>{Number(item.unit_price || 0).toLocaleString('vi-VN')} đ</td>
                    <td>{Number(item.total_extra || 0).toLocaleString('vi-VN')} đ</td>
                    <td>
                      <strong>
                        {Number(item.total_amount || 0).toLocaleString('vi-VN')} đ
                      </strong>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          color: status.color,
                          background: status.background,
                          border: `1px solid ${status.border}`,
                        }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td>{item.quotation_pdf_path ? 'Đã có PDF' : 'Chưa có PDF'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}