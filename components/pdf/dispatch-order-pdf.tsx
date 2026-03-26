import React from 'react'
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import type { CompanyInfo, DispatchOrderPayload } from '../../lib/types/transport'

type Props = {
  company: CompanyInfo
  order: DispatchOrderPayload
  logoSrc?: string | null
  useVietnameseFont?: boolean
}

function formatDateVN(value?: string | null) {
  if (!value) return '-'
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

function formatTimeVN(value?: string | null) {
  if (!value) return '-'
  return String(value).slice(0, 5)
}

function formatDateTimeVN(date?: string | null, time?: string | null) {
  const formattedDate = date ? formatDateVN(date) : ''
  const formattedTime = time ? formatTimeVN(time) : ''

  if (formattedDate && formattedTime) {
    return `${formattedDate} ${formattedTime}`
  }

  return formattedDate || formattedTime || '-'
}

function createStyles(useVietnameseFont: boolean) {
  return StyleSheet.create({
    page: {
      padding: 24,
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
      marginBottom: 12,
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

    companyLine: {
      fontSize: 9.2,
      lineHeight: 1.5,
      color: '#40566E',
      textAlign: 'center',
      marginBottom: 2,
    },

    titleWrap: {
      alignItems: 'center',
      marginBottom: 12,
    },

    title: {
      fontSize: 18,
      fontWeight: 700,
      color: '#0B5CAB',
      textAlign: 'center',
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

    fieldRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },

    fieldLabel: {
      width: 110,
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

    colNo: { width: '7%' },
    colDate: { width: '14%' },
    colTime: { width: '18%' },
    colItinerary: { width: '33%' },
    colKm: { width: '8%' },
    colNote: { width: '20%' },

    signWrap: {
      marginTop: 12,
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
  })
}

export default function DispatchOrderPdfDocument({
  company,
  order,
  logoSrc,
  useVietnameseFont = false,
}: Props) {
  const styles = createStyles(useVietnameseFont)
  const totalKm = order.legs.reduce((sum, leg) => sum + Number(leg.distanceKm || 0), 0)

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
          <Text style={styles.companyLine}>Địa chỉ: {company.address}</Text>
          <Text style={styles.companyLine}>
            Điện thoại: {company.phone}
            {company.hotline ? ` • Hotline: ${company.hotline}` : ''}
          </Text>
          <Text style={styles.companyLine}>
            Email: {company.email}
            {company.website ? ` • Website: ${company.website}` : ''}
          </Text>
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>LỆNH ĐIỀU XE</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Thông tin điều xe</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Code đoàn</Text>
            <Text style={styles.fieldValue}>{order.bookingCode || '-'}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Tên đoàn</Text>
            <Text style={styles.fieldValue}>{order.groupName || '-'}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Bắt đầu</Text>
            <Text style={styles.fieldValue}>
              {formatDateTimeVN(order.startDate, order.startTime)}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Kết thúc</Text>
            <Text style={styles.fieldValue}>
              {formatDateTimeVN(order.endDate, order.endTime)}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Điểm đón</Text>
            <Text style={styles.fieldValue}>{order.pickupLocation || '-'}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Điểm trả</Text>
            <Text style={styles.fieldValue}>{order.dropoffLocation || '-'}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>SĐT liên hệ</Text>
            <Text style={styles.fieldValue}>{order.phone || '-'}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Xe</Text>
            <Text style={styles.fieldValue}>{order.vehicleAssigned || 'Chưa gán'}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Lái xe</Text>
            <Text style={styles.fieldValue}>{order.driverAssigned || 'Chưa gán'}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Loại xe</Text>
            <Text style={styles.fieldValue}>{order.vehicleType || '-'}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Trạng thái</Text>
            <Text style={styles.fieldValue}>{order.status || 'pending'}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Ghi chú</Text>
            <Text style={styles.fieldValue}>{order.notes || '-'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Lịch trình chi tiết</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={styles.colNo}>
                <Text style={styles.cellHeader}>STT</Text>
              </View>
              <View style={styles.colDate}>
                <Text style={styles.cellHeader}>Ngày</Text>
              </View>
              <View style={styles.colTime}>
                <Text style={styles.cellHeader}>Giờ</Text>
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
            </View>

            {order.legs.length > 0 ? (
              order.legs.map((leg, index) => (
                <View
                  key={`${leg.seqNo || index + 1}-${index}`}
                  style={[
                    styles.row,
                    index === order.legs.length - 1 ? styles.rowLast : {},
                  ]}
                >
                  <View style={styles.colNo}>
                    <Text style={styles.cell}>{leg.seqNo || index + 1}</Text>
                  </View>
                  <View style={styles.colDate}>
                    <Text style={styles.cell}>{formatDateVN(leg.tripDate)}</Text>
                  </View>
                  <View style={styles.colTime}>
                    <Text style={styles.cell}>
                      {formatTimeVN(leg.pickupTime)} → {formatTimeVN(leg.dropoffTime)}
                    </Text>
                  </View>
                  <View style={styles.colItinerary}>
                    <Text style={styles.cell}>{leg.itinerary || '-'}</Text>
                  </View>
                  <View style={styles.colKm}>
                    <Text style={styles.cell}>{leg.distanceKm || 0}</Text>
                  </View>
                  <View style={styles.colNote}>
                    <Text style={styles.cell}>{leg.note || '-'}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.rowLast}>
                <Text style={styles.emptyCell}>Chưa có lịch trình</Text>
              </View>
            )}
          </View>

          <View style={{ marginTop: 8 }}>
            <Text>Tổng km dự kiến: {totalKm}</Text>
          </View>
        </View>

        <View style={styles.signWrap}>
          <View style={styles.signBox}>
            <Text style={styles.signTitle}>ĐIỀU HÀNH</Text>
            <Text style={styles.signSub}>(Ký và ghi rõ họ tên)</Text>
            <View style={styles.blankSignatureArea} />
          </View>

          <View style={styles.signBox}>
            <Text style={styles.signTitle}>LÁI XE</Text>
            <Text style={styles.signSub}>(Ký và ghi rõ họ tên)</Text>
            <View style={styles.blankSignatureArea} />
          </View>
        </View>
      </Page>
    </Document>
  )
}