import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import type {
  CompanyInfo,
  QuotationLegPayload,
  QuotationPayload,
} from '../../lib/types/transport'

type DocumentVariant = 'preliminary' | 'final'

type Props = {
  company: CompanyInfo
  booking: QuotationPayload
  logoSrc?: string | null
  useVietnameseFont?: boolean
  variant?: DocumentVariant
}

function createStyles(useVietnameseFont: boolean) {
  return StyleSheet.create({
    page: {
      paddingTop: 20,
      paddingBottom: 20,
      paddingHorizontal: 22,
      fontSize: 10,
      color: '#10243E',
      fontFamily: useVietnameseFont ? 'NotoSans' : 'Helvetica',
      backgroundColor: '#FFFFFF',
    },

    headerCard: {
      borderWidth: 1,
      borderColor: '#D8E4F0',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: '#FAFCFF',
      marginBottom: 10,
      alignItems: 'center',
    },

    logoWrap: {
      width: 62,
      height: 62,
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E6EEF7',
      padding: 4,
      marginBottom: 8,
    },

    logo: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    },

    companyName: {
      fontSize: 14,
      fontWeight: 700,
      color: '#0B5CAB',
      textAlign: 'center',
      lineHeight: 1.35,
      marginBottom: 8,
    },

    companyContactWrap: {
      width: '100%',
      borderTopWidth: 1,
      borderTopColor: '#E7EEF6',
      paddingTop: 8,
      alignItems: 'center',
    },

    companyLine: {
      fontSize: 9.2,
      lineHeight: 1.5,
      color: '#40566E',
      textAlign: 'center',
      marginBottom: 2,
    },

    centeredTitleWrap: {
      alignItems: 'center',
      marginBottom: 10,
    },

    centeredTitle: {
      fontSize: 18,
      fontWeight: 700,
      color: '#0B5CAB',
      marginBottom: 4,
      textAlign: 'center',
    },

    centeredSub: {
      fontSize: 10,
      textAlign: 'center',
      marginBottom: 2,
      color: '#40566E',
    },

    section: {
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#D8E4F0',
      borderRadius: 10,
      padding: 10,
      backgroundColor: '#FFFFFF',
    },

    sectionTitle: {
      fontSize: 11,
      fontWeight: 700,
      marginBottom: 8,
      color: '#0B5CAB',
    },

    twoCol: {
      flexDirection: 'row',
      gap: 12,
    },

    colWide: {
      width: '64%',
    },

    colNarrow: {
      width: '36%',
    },

    fieldRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },

    fieldLabel: {
      width: 95,
      color: '#5D748F',
      fontSize: 9.3,
    },

    fieldValue: {
      flex: 1,
      fontSize: 10,
    },

    table: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#D8E4F0',
      borderRadius: 8,
      overflow: 'hidden',
    },

    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#EEF6FF',
      borderBottomWidth: 1,
      borderBottomColor: '#D8E4F0',
    },

    row: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#E7EEF6',
    },

    rowLast: {
      borderBottomWidth: 0,
    },

    cellHeader: {
      fontSize: 9,
      fontWeight: 700,
      padding: 8,
      color: '#284C74',
    },

    cell: {
      fontSize: 9,
      padding: 8,
      color: '#23384F',
    },

    emptyCell: {
      fontSize: 9,
      padding: 10,
      color: '#5D748F',
      textAlign: 'center',
    },

    colNo: { width: '6%' },
    colDate: { width: '12%' },
    colItinerary: { width: '40%' },
    colKm: { width: '8%' },
    colNote: { width: '16%' },
    colExtra: { width: '18%' },

    summaryAndTermsGroup: {
      marginBottom: 10,
    },

    summaryWrap: {
      marginTop: 8,
      width: '100%',
      borderWidth: 1,
      borderColor: '#CFE0F2',
      borderRadius: 10,
      backgroundColor: '#F5FAFF',
      padding: 8,
      marginBottom: 8,
    },

    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },

    summaryLabel: {
      fontSize: 10,
      color: '#4E6A88',
    },

    summaryValue: {
      fontSize: 10,
      fontWeight: 700,
    },

    grandTotal: {
      marginTop: 4,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#D8E4F0',
    },

    noteBox: {
      borderWidth: 1,
      borderColor: '#D8E4F0',
      borderRadius: 8,
      padding: 10,
      backgroundColor: '#FAFCFF',
      minHeight: 58,
    },

    noteText: {
      fontSize: 9.5,
      lineHeight: 1.45,
      color: '#40566E',
    },

    terms: {
      fontSize: 9.5,
      lineHeight: 1.5,
      color: '#40566E',
    },

    signWrap: {
      marginTop: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
    },

    signBox: {
      flex: 1,
      alignItems: 'center',
      minHeight: 82,
    },

    signTitle: {
      fontSize: 10,
      fontWeight: 700,
      marginBottom: 8,
    },

    signSub: {
      fontSize: 9,
      color: '#5D748F',
      marginTop: 4,
    },

    blankSignatureArea: {
      width: 150,
      height: 28,
      marginTop: 10,
    },

    footer: {
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#E7EEF6',
      paddingTop: 8,
      fontSize: 8.5,
      color: '#6B819B',
      textAlign: 'center',
    },
  })
}

function money(value: number) {
  return `${value.toLocaleString('vi-VN')} đ`
}

function safe(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

function formatDateVN(value?: string | null) {
  if (!value) return '-'
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

function renderLegRow(
  leg: QuotationLegPayload,
  index: number,
  total: number,
  styles: ReturnType<typeof createStyles>,
) {
  return (
    <View
      style={[styles.row, index === total - 1 ? styles.rowLast : {}]}
      key={`${leg.seqNo}-${index}`}
    >
      <View style={styles.colNo}>
        <Text style={styles.cell}>{safe(leg.seqNo)}</Text>
      </View>
      <View style={styles.colDate}>
        <Text style={styles.cell}>{formatDateVN(leg.tripDate)}</Text>
      </View>
      <View style={styles.colItinerary}>
        <Text style={styles.cell}>{safe(leg.itinerary)}</Text>
      </View>
      <View style={styles.colKm}>
        <Text style={styles.cell}>{safe(leg.distanceKm)}</Text>
      </View>
      <View style={styles.colNote}>
        <Text style={styles.cell}>{safe(leg.note)}</Text>
      </View>
      <View style={styles.colExtra}>
        <Text style={styles.cell}>{money(Number(leg.extraAmount || 0))}</Text>
      </View>
    </View>
  )
}

export default function QuotationPdfDocument({
  company,
  booking,
  logoSrc,
  useVietnameseFont = false,
  variant = 'preliminary',
}: Props) {
  const styles = createStyles(useVietnameseFont)
  const tripAmount = Number(booking.totalKm || 0) * Number(booking.unitPrice || 0)
  const legs = Array.isArray(booking.legs) ? booking.legs : []

  const isFinal = variant === 'final'
  const title = isFinal ? 'HÓA ĐƠN FINAL DỊCH VỤ XE' : 'BÁO GIÁ SƠ BỘ DỊCH VỤ XE'
  const subtitle = isFinal
    ? 'Tài liệu final theo lịch trình thực tế đã chốt tại điều hành'
    : 'Báo giá sơ bộ theo thông tin booking dự kiến ban đầu'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerCard}>
          {logoSrc ? (
            <View style={styles.logoWrap}>
              <Image src={logoSrc} style={styles.logo} />
            </View>
          ) : null}

          <Text style={styles.companyName}>{company.name}</Text>

          <View style={styles.companyContactWrap}>
            <Text style={styles.companyLine}>Địa chỉ: {company.address}</Text>
            <Text style={styles.companyLine}>Điện thoại: {company.phone}</Text>
            <Text style={styles.companyLine}>
              Email: {company.email}
              {company.taxCode ? ` • MST: ${company.taxCode}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.centeredTitleWrap}>
          <Text style={styles.centeredTitle}>{title}</Text>
          <Text style={styles.centeredSub}>{subtitle}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Thông tin booking</Text>

          <View style={styles.twoCol}>
            <View style={styles.colWide}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Mã booking</Text>
                <Text style={styles.fieldValue}>{safe(booking.bookingCode)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Tên đoàn</Text>
                <Text style={styles.fieldValue}>{safe(booking.groupName)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Text style={styles.fieldValue}>{safe(booking.email)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Số điện thoại</Text>
                <Text style={styles.fieldValue}>{safe(booking.phone)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Điểm đón</Text>
                <Text style={styles.fieldValue}>{safe(booking.pickupLocation)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Điểm trả</Text>
                <Text style={styles.fieldValue}>{safe(booking.dropoffLocation)}</Text>
              </View>
            </View>

            <View style={styles.colNarrow}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Số khách</Text>
                <Text style={styles.fieldValue}>{safe(booking.passengerCount)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Loại xe</Text>
                <Text style={styles.fieldValue}>{safe(booking.vehicleType)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Ngày đi</Text>
                <Text style={styles.fieldValue}>{formatDateVN(booking.startDate)}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Ngày về</Text>
                <Text style={styles.fieldValue}>{formatDateVN(booking.endDate)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Chi tiết hành trình</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={styles.colNo}>
                <Text style={styles.cellHeader}>STT</Text>
              </View>
              <View style={styles.colDate}>
                <Text style={styles.cellHeader}>Ngày</Text>
              </View>
              <View style={styles.colItinerary}>
                <Text style={styles.cellHeader}>Lịch trình</Text>
              </View>
              <View style={styles.colKm}>
                <Text style={styles.cellHeader}>Km</Text>
              </View>
              <View style={styles.colNote}>
                <Text style={styles.cellHeader}>Ghi chú</Text>
              </View>
              <View style={styles.colExtra}>
                <Text style={styles.cellHeader}>Phát sinh thêm</Text>
              </View>
            </View>

            {legs.length > 0 ? (
              legs.map((leg, index) => renderLegRow(leg, index, legs.length, styles))
            ) : (
              <View style={styles.rowLast}>
                <Text style={styles.emptyCell}>Chưa có lịch trình</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Ghi chú booking</Text>
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>{safe(booking.notes)}</Text>
          </View>
        </View>

        <View style={styles.summaryAndTermsGroup} wrap={false}>
          <View style={styles.summaryWrap}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Đơn giá / km</Text>
              <Text style={styles.summaryValue}>{money(Number(booking.unitPrice || 0))}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng km</Text>
              <Text style={styles.summaryValue}>{safe(booking.totalKm)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tiền theo km</Text>
              <Text style={styles.summaryValue}>{money(tripAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phát sinh thêm</Text>
              <Text style={styles.summaryValue}>{money(Number(booking.totalExtra || 0))}</Text>
            </View>
            <View style={[styles.summaryRow, styles.grandTotal]}>
              <Text style={styles.summaryLabel}>Tổng cộng</Text>
              <Text style={styles.summaryValue}>
                {money(Number(booking.totalAmount || 0))}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Điều khoản</Text>
            <Text style={styles.terms}>
              {isFinal
                ? [
                    '- Hóa đơn final được lập theo lịch trình thực tế đã chốt tại điều hành.',
                    '- Các thay đổi so với báo giá sơ bộ đã được cập nhật vào dữ liệu booking thực tế.',
                    '- Giá trị final phản ánh khối lượng dịch vụ thực tế tại thời điểm xuất tài liệu.',
                    '- Tài liệu này dùng để đối chiếu và xác nhận giá trị dịch vụ final.',
                  ].join('\n')
                : [
                    '- Báo giá sơ bộ được lập dựa trên thông tin booking dự kiến ban đầu.',
                    '- Lịch trình thực tế có thể thay đổi tại điều hành.',
                    '- Chi phí final sẽ được xác nhận lại theo dữ liệu vận hành thực tế.',
                    '- Tài liệu này dùng cho bước chào giá và tham khảo ban đầu.',
                  ].join('\n')}
            </Text>
          </View>
        </View>

        <View style={styles.signWrap}>
          <View style={styles.signBox}>
            <Text style={styles.signTitle}>ĐẠI DIỆN KHÁCH HÀNG</Text>
            <Text style={styles.signSub}>(Ký, ghi rõ họ tên)</Text>
            <View style={styles.blankSignatureArea} />
          </View>

          <View style={styles.signBox}>
            <Text style={styles.signTitle}>ĐẠI DIỆN CÔNG TY</Text>
            <Text style={styles.signSub}>(Ký, đóng dấu nếu có)</Text>
            <View style={styles.blankSignatureArea} />
          </View>
        </View>

        <Text style={styles.footer}>
          {company.name} • {company.phone} • {company.email}
        </Text>
      </Page>
    </Document>
  )
}