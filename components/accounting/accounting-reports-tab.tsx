'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ChartBarItem = {
  label: string
  value: number
}

type AssignmentCoverage = {
  vehicleAssigned: number
  vehicleUnassigned: number
  driverAssigned: number
  driverUnassigned: number
}

type ChartData = {
  bookingsOverTime: ChartBarItem[]
  revenueOverTime: ChartBarItem[]
  bookingStatus: ChartBarItem[]
  assignmentCoverage: AssignmentCoverage
  vehicleUtilization: ChartBarItem[]
  vehicleRevenue: ChartBarItem[]
  driverUtilization: ChartBarItem[]
  revenueByVehicleType: ChartBarItem[]
  revenueBySource: ChartBarItem[]
  avgRevenueOverTime: ChartBarItem[]
  cancellationRateOverTime: ChartBarItem[]
}

const STATUS_COLORS: Record<string, string> = {
  Pending: '#94a3b8',
  Confirmed: '#7c3aed',
  Assigned: '#2563eb',
  'In progress': '#ea580c',
  Completed: '#16a34a',
  Canceled: '#dc2626',
}

const COVERAGE_COLORS = ['#2563eb', '#93c5fd', '#16a34a', '#86efac']
const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']

function formatCurrency(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} đ`
}

function formatKm(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} km`
}

function normalizeStatusLabel(label: string) {
  switch ((label || '').toLowerCase()) {
    case 'confirmed':
      return 'Confirmed'
    case 'assigned':
      return 'Assigned'
    case 'in_progress':
      return 'In progress'
    case 'completed':
      return 'Completed'
    case 'canceled':
    case 'cancelled':
    case 'cancel':
      return 'Canceled'
    case 'pending':
    default:
      return 'Pending'
  }
}

function formatTimeAxisLabel(label: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    const [, month, day] = label.split('-')
    return `${day}/${month}`
  }

  if (/^\d{4}-\d{2}$/.test(label)) {
    const [, month] = label.split('-')
    return `T${month}`
  }

  return label
}

function getTimeAxisInterval(length: number) {
  if (length <= 12) return 0
  if (length <= 20) return 1
  if (length <= 31) return 2
  return Math.ceil(length / 12)
}

function formatTimeTooltipLabel(label: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    const [year, month, day] = label.split('-')
    return `${day}/${month}/${year}`
  }

  if (/^\d{4}-\d{2}$/.test(label)) {
    const [year, month] = label.split('-')
    return `Tháng ${month}/${year}`
  }

  return label
}

function formatVehicleTypeLabel(label: string) {
  switch ((label || '').trim()) {
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
    case 'Unknown':
      return 'Chưa rõ'
    default:
      return label || 'Chưa rõ'
  }
}

function EmptyChart({ text }: { text: string }) {
  return <div className="empty-box">{text}</div>
}

function ChartCard({
  title,
  note,
  children,
}: {
  title: string
  note: string
  children: ReactNode
}) {
  return (
    <div className="section-card">
      <h3 className="section-title">{title}</h3>

      <div style={{ marginTop: 12 }}>{children}</div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 10,
          background: '#f8fafc',
          color: '#475569',
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        {note}
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  subtext,
}: {
  label: string
  value: string
  subtext: string
}) {
  return (
    <div className="kpi-card">
      <p>{label}</p>
      <h3>{value}</h3>
      <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>{subtext}</div>
    </div>
  )
}

function getYearOptions() {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, index) => String(currentYear - index))
}

export default function AccountingReportsTab() {
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [month, setMonth] = useState('all')
  const [charts, setCharts] = useState<ChartData>({
    bookingsOverTime: [],
    revenueOverTime: [],
    bookingStatus: [],
    assignmentCoverage: {
      vehicleAssigned: 0,
      vehicleUnassigned: 0,
      driverAssigned: 0,
      driverUnassigned: 0,
    },
    vehicleUtilization: [],
    vehicleRevenue: [],
    driverUtilization: [],
    revenueByVehicleType: [],
    revenueBySource: [],
    avgRevenueOverTime: [],
    cancellationRateOverTime: [],
  })

  useEffect(() => {
    let mounted = true

    async function loadReportData() {
      try {
        setLoading(true)
        setErrorText('')

        const query = new URLSearchParams({
          year,
          month,
        })

        const res = await fetch(`/api/accounting/overview?${query.toString()}`, {
          cache: 'no-store',
        })
        const json = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(json?.error || 'Không thể tải dữ liệu báo cáo')
        }

        if (!mounted) return

        setCharts({
          bookingsOverTime: Array.isArray(json?.charts?.bookingsOverTime)
            ? json.charts.bookingsOverTime
            : [],
          revenueOverTime: Array.isArray(json?.charts?.revenueOverTime)
            ? json.charts.revenueOverTime
            : [],
          bookingStatus: Array.isArray(json?.charts?.bookingStatus)
            ? json.charts.bookingStatus
            : [],
          assignmentCoverage: {
            vehicleAssigned: Number(json?.charts?.assignmentCoverage?.vehicleAssigned || 0),
            vehicleUnassigned: Number(json?.charts?.assignmentCoverage?.vehicleUnassigned || 0),
            driverAssigned: Number(json?.charts?.assignmentCoverage?.driverAssigned || 0),
            driverUnassigned: Number(json?.charts?.assignmentCoverage?.driverUnassigned || 0),
          },
          vehicleUtilization: Array.isArray(json?.charts?.vehicleUtilization)
            ? json.charts.vehicleUtilization
            : [],
          vehicleRevenue: Array.isArray(json?.charts?.vehicleRevenue)
            ? json.charts.vehicleRevenue
            : [],
          driverUtilization: Array.isArray(json?.charts?.driverUtilization)
            ? json.charts.driverUtilization
            : [],
          revenueByVehicleType: Array.isArray(json?.charts?.revenueByVehicleType)
            ? json.charts.revenueByVehicleType
            : [],
          revenueBySource: Array.isArray(json?.charts?.revenueBySource)
            ? json.charts.revenueBySource
            : [],
          avgRevenueOverTime: Array.isArray(json?.charts?.avgRevenueOverTime)
            ? json.charts.avgRevenueOverTime
            : [],
          cancellationRateOverTime: Array.isArray(json?.charts?.cancellationRateOverTime)
            ? json.charts.cancellationRateOverTime
            : [],
        })
      } catch (error) {
        console.error(error)
        if (!mounted) return
        setErrorText(
          error instanceof Error ? error.message : 'Không thể tải dữ liệu báo cáo',
        )
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadReportData()

    return () => {
      mounted = false
    }
  }, [year, month])

  const bookingsOverTime = charts.bookingsOverTime || []
  const revenueOverTime = charts.revenueOverTime || []
  const bookingStatus = (charts.bookingStatus || []).map((item) => ({
    ...item,
    label: normalizeStatusLabel(item.label),
  }))
  const revenueByVehicleType = (charts.revenueByVehicleType || []).map((item) => ({
    ...item,
    label: formatVehicleTypeLabel(item.label),
  }))
  const revenueBySource = charts.revenueBySource || []
  const avgRevenueOverTime = charts.avgRevenueOverTime || []
  const cancellationRateOverTime = charts.cancellationRateOverTime || []

  const bookingTimeAxisInterval = getTimeAxisInterval(bookingsOverTime.length)
  const revenueTimeAxisInterval = getTimeAxisInterval(revenueOverTime.length)
  const avgRevenueTimeAxisInterval = getTimeAxisInterval(avgRevenueOverTime.length)
  const cancelRateAxisInterval = getTimeAxisInterval(cancellationRateOverTime.length)

  const assignmentCoverageData: ChartBarItem[] = [
    { label: 'Đã gán xe', value: charts.assignmentCoverage.vehicleAssigned },
    { label: 'Chưa gán xe', value: charts.assignmentCoverage.vehicleUnassigned },
    { label: 'Đã gán tài xế', value: charts.assignmentCoverage.driverAssigned },
    { label: 'Chưa gán tài xế', value: charts.assignmentCoverage.driverUnassigned },
  ]

  const vehicleUtilization = charts.vehicleUtilization || []
  const vehicleRevenue = charts.vehicleRevenue || []
  const driverUtilization = charts.driverUtilization || []

  const totalBookings = bookingsOverTime.reduce((sum, item) => sum + item.value, 0)
  const totalRevenue = revenueOverTime.reduce((sum, item) => sum + item.value, 0)
  const totalAssignments =
    assignmentCoverageData.reduce((sum, item) => sum + item.value, 0) / 2 || 0

  const reportSubtext = useMemo(() => {
    if (month === 'all') {
      return `Báo cáo chung cho cả năm ${year}`
    }
    return `Báo cáo cho ${year}-${month}`
  }, [year, month])

  return (
    <>
      <div className="section-card">
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'end',
            flexWrap: 'wrap',
          }}
        >
          <div className="field" style={{ minWidth: 180 }}>
            <label className="label">Năm</label>
            <select
              className="select"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {getYearOptions().map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ minWidth: 180 }}>
            <label className="label">Tháng</label>
            <select
              className="select"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="all">Cả năm</option>
              <option value="01">Tháng 01</option>
              <option value="02">Tháng 02</option>
              <option value="03">Tháng 03</option>
              <option value="04">Tháng 04</option>
              <option value="05">Tháng 05</option>
              <option value="06">Tháng 06</option>
              <option value="07">Tháng 07</option>
              <option value="08">Tháng 08</option>
              <option value="09">Tháng 09</option>
              <option value="10">Tháng 10</option>
              <option value="11">Tháng 11</option>
              <option value="12">Tháng 12</option>
            </select>
          </div>

          <div style={{ color: '#64748b', fontSize: 14, paddingBottom: 10 }}>
            {reportSubtext}
          </div>
        </div>
      </div>

      {errorText && (
        <div
          className="section-card"
          style={{
            color: '#b91c1c',
            border: '1px solid #fecaca',
            background: '#fef2f2',
          }}
        >
          {errorText}
        </div>
      )}

      {loading ? (
        <div className="section-card">Đang tải dữ liệu báo cáo...</div>
      ) : (
        <>
          <div className="card-row">
            <KpiCard
              label="Tổng booking"
              value={totalBookings.toLocaleString('vi-VN')}
              subtext={reportSubtext}
            />
            <KpiCard
              label="Tổng doanh thu"
              value={formatCurrency(totalRevenue)}
              subtext={reportSubtext}
            />
            <KpiCard
              label="Tổng assignment"
              value={totalAssignments.toLocaleString('vi-VN')}
              subtext={reportSubtext}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 20,
            }}
          >
            <ChartCard
              title="1) Booking theo thời gian"
              note="Nguồn: bookings. Cho biết nhu cầu theo ngày/tháng, xu hướng tăng trưởng và mùa cao điểm - thấp điểm."
            >
              {bookingsOverTime.length === 0 ? (
                <EmptyChart text="Chưa có dữ liệu booking theo thời gian." />
              ) : (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={bookingsOverTime}
                      margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tickFormatter={formatTimeAxisLabel}
                        interval={bookingTimeAxisInterval}
                        minTickGap={16}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis allowDecimals={false} width={36} />
                      <Tooltip
                        formatter={(value) => [
                          Number(value ?? 0).toLocaleString('vi-VN'),
                          'Số booking',
                        ]}
                        labelFormatter={(label) => formatTimeTooltipLabel(String(label))}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Số booking"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="2) Doanh thu theo thời gian"
              note="Nguồn: giá trị booking. Cho biết công ty kiếm tiền theo thời gian, tháng nào đóng góp doanh thu lớn nhất."
            >
              {revenueOverTime.length === 0 ? (
                <EmptyChart text="Chưa có dữ liệu doanh thu theo thời gian." />
              ) : (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={revenueOverTime}
                      margin={{ top: 8, right: 16, left: 28, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tickFormatter={formatTimeAxisLabel}
                        interval={revenueTimeAxisInterval}
                        minTickGap={16}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        width={84}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => Number(value ?? 0).toLocaleString('vi-VN')}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value ?? 0))}
                        labelFormatter={(label) => formatTimeTooltipLabel(String(label))}
                      />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Doanh thu"
                        fill="#16a34a"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="3) Booking theo trạng thái"
              note="Nguồn: assignments.status. Trả lời bao nhiêu booking đã hoàn tất, bao nhiêu đang xử lý, tỷ lệ hủy ra sao."
            >
              {bookingStatus.length === 0 ? (
                <EmptyChart text="Chưa có dữ liệu trạng thái booking." />
              ) : (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={bookingStatus}
                        dataKey="value"
                        nameKey="label"
                        outerRadius={110}
                        label
                      >
                        {bookingStatus.map((entry) => (
                          <Cell
                            key={entry.label}
                            fill={STATUS_COLORS[entry.label] || '#64748b'}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="4) Tỷ lệ phân công xe & tài xế"
              note="Biểu đồ KPI điều phối: cho biết bao nhiêu booking đã được gán xe, đã được gán tài xế và còn backlog chưa phân công."
            >
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={assignmentCoverageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Số booking" radius={[6, 6, 0, 0]}>
                      {assignmentCoverageData.map((_, index) => (
                        <Cell
                          key={`coverage-${index}`}
                          fill={COVERAGE_COLORS[index % COVERAGE_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="5) Mức sử dụng xe"
              note="Nguồn: assignments.vehicle_id + vehicles + bookings.total_km. Cho biết tổng số km mà từng xe đã phục vụ."
            >
              {vehicleUtilization.length === 0 ? (
                <EmptyChart text="Chưa có dữ liệu mức sử dụng xe." />
              ) : (
                <div style={{ width: '100%', height: Math.max(360, vehicleUtilization.length * 42) }}>
                  <ResponsiveContainer>
                    <BarChart data={vehicleUtilization} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="label" width={180} />
                      <Tooltip formatter={(value) => formatKm(Number(value ?? 0))} />
                      <Legend />
                      <Bar dataKey="value" name="Tổng km" fill="#0f766e" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="6) Thu nhập theo xe"
              note="Nguồn: assignments.vehicle_id + vehicles + bookings.total_amount. Cho biết xe nào tạo ra doanh thu cao nhất."
            >
              {vehicleRevenue.length === 0 ? (
                <EmptyChart text="Chưa có dữ liệu thu nhập theo xe." />
              ) : (
                <div style={{ width: '100%', height: Math.max(360, vehicleRevenue.length * 42) }}>
                  <ResponsiveContainer>
                    <BarChart data={vehicleRevenue} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="label" width={180} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                      <Legend />
                      <Bar dataKey="value" name="Tổng doanh thu" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="7) Mức sử dụng tài xế"
              note="Nguồn: assignments.driver_id + drivers + bookings.total_km. Biểu đồ hiển thị tổng số km mà từng tài xế đã chạy."
            >
              {driverUtilization.length === 0 ? (
                <EmptyChart text="Chưa có dữ liệu mức sử dụng tài xế." />
              ) : (
                <div style={{ width: '100%', height: Math.max(360, driverUtilization.length * 42) }}>
                  <ResponsiveContainer>
                    <BarChart data={driverUtilization} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="label" width={180} />
                      <Tooltip formatter={(value) => formatKm(Number(value ?? 0))} />
                      <Legend />
                      <Bar dataKey="value" name="Tổng km" fill="#7c3aed" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="8) Doanh thu theo loại xe"
              note="Biểu đồ chiến lược cho doanh nghiệp: cho biết loại xe nào tạo doanh thu nhiều nhất để hỗ trợ quyết định đầu tư đội xe."
            >
              {revenueByVehicleType.length === 0 ? (
                <EmptyChart text="Chưa có dữ liệu doanh thu theo loại xe." />
              ) : (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={revenueByVehicleType}
                        dataKey="value"
                        nameKey="label"
                        outerRadius={110}
                        label
                      >
                        {revenueByVehicleType.map((entry, index) => (
                          <Cell
                            key={`${entry.label}-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="9) Direct vs Partner revenue"
              note="Cho biết doanh thu đến từ khách trực tiếp hay công ty đối tác. Đây là chart rất hữu ích để theo dõi cơ cấu nguồn doanh thu."
            >
              {revenueBySource.length === 0 ? (
                <EmptyChart text="Chưa có dữ liệu doanh thu theo nguồn booking." />
              ) : (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={revenueBySource}
                        dataKey="value"
                        nameKey="label"
                        outerRadius={110}
                        label
                      >
                        {revenueBySource.map((entry, index) => (
                          <Cell
                            key={`${entry.label}-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="10) Doanh thu trung bình mỗi booking"
              note="Cho biết giá trị trung bình của một booking theo thời gian. Rất hữu ích để theo dõi chất lượng doanh thu, không chỉ số lượng booking."
            >
              {avgRevenueOverTime.length === 0 ? (
                <EmptyChart text="Chưa có dữ liệu doanh thu trung bình mỗi booking." />
              ) : (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={avgRevenueOverTime}
                      margin={{ top: 8, right: 16, left: 28, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tickFormatter={formatTimeAxisLabel}
                        interval={avgRevenueTimeAxisInterval}
                        minTickGap={16}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        width={84}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => Number(value ?? 0).toLocaleString('vi-VN')}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value ?? 0))}
                        labelFormatter={(label) => formatTimeTooltipLabel(String(label))}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Doanh thu TB / booking"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="11) Tỷ lệ hủy booking theo thời gian"
              note="Cho biết tỷ lệ booking bị hủy theo thời gian. Đây là KPI quan trọng để theo dõi chất lượng vận hành và độ ổn định nguồn khách."
            >
              {cancellationRateOverTime.length === 0 ? (
                <EmptyChart text="Chưa có dữ liệu tỷ lệ hủy booking." />
              ) : (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={cancellationRateOverTime}
                      margin={{ top: 8, right: 16, left: 20, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tickFormatter={formatTimeAxisLabel}
                        interval={cancelRateAxisInterval}
                        minTickGap={16}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        unit="%"
                        width={52}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value) => `${Number(value ?? 0).toFixed(1)} %`}
                        labelFormatter={(label) => formatTimeTooltipLabel(String(label))}
                      />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Tỷ lệ hủy"
                        fill="#ef4444"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </>
  )
}