/**
 * Demo Data Seeder
 * ─────────────────────────────────────────────────────────────
 * Populates a fresh Supabase project with realistic demo data.
 *
 * Usage (from project root):
 *   npx tsx scripts/seed-demo-data.ts
 *
 * Requirements:
 *   - .env.local must have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   - A user account must already exist in Supabase Auth (admin@demo.com)
 *   - Run Supabase migrations first (supabase/migrations/*.sql)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load env
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// ─── Helper ──────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Seed Data ───────────────────────────────────────────────

async function seedVehicles() {
  console.log('🚐 Seeding vehicles...')
  const vehicles = [
    { plate_number: '29A-11111', vehicle_name: 'Toyota Innova #1', seat_count: 7, is_active: true },
    { plate_number: '29A-22222', vehicle_name: 'Toyota Innova #2', seat_count: 7, is_active: true },
    { plate_number: '29B-33333', vehicle_name: 'Ford Transit #1', seat_count: 16, is_active: true },
    { plate_number: '29B-44444', vehicle_name: 'Ford Transit #2', seat_count: 16, is_active: true },
    { plate_number: '29C-55555', vehicle_name: 'Hyundai Solati #1', seat_count: 29, is_active: true },
    { plate_number: '29C-66666', vehicle_name: 'Hyundai Solati #2', seat_count: 29, is_active: true },
    { plate_number: '51A-99999', vehicle_name: 'Thaco Bus 45 chỗ', seat_count: 45, is_active: true },
    { plate_number: '29D-77777', vehicle_name: 'Kia Sedona (5 chỗ)', seat_count: 5, is_active: true },
    { plate_number: '29D-88888', vehicle_name: 'Toyota Fortuner', seat_count: 7, is_active: false },
    { plate_number: '29E-12345', vehicle_name: 'Mercedes Sprinter', seat_count: 9, is_active: true },
  ]

  const { error } = await supabase.from('vehicles').upsert(vehicles, { onConflict: 'plate_number' })
  if (error) throw new Error(`Vehicles: ${error.message}`)
  console.log(`  ✅ ${vehicles.length} vehicles`)
}

async function seedDrivers() {
  console.log('👨‍✈️ Seeding drivers...')
  const drivers = [
    { full_name: 'Nguyễn Văn An', phone: '0912 345 678', is_active: true },
    { full_name: 'Trần Văn Bình', phone: '0923 456 789', is_active: true },
    { full_name: 'Lê Văn Chiến', phone: '0934 567 890', is_active: true },
    { full_name: 'Phạm Văn Dũng', phone: '0945 678 901', is_active: true },
    { full_name: 'Hoàng Văn Em', phone: '0956 789 012', is_active: true },
    { full_name: 'Đặng Văn Phúc', phone: '0967 890 123', is_active: true },
    { full_name: 'Ngô Văn Giang', phone: '0978 901 234', is_active: true },
    { full_name: 'Vũ Văn Hải', phone: '0989 012 345', is_active: false },
  ]

  const { error } = await supabase.from('drivers').upsert(drivers, { onConflict: 'full_name' })
  if (error) throw new Error(`Drivers: ${error.message}`)
  console.log(`  ✅ ${drivers.length} drivers`)
}

async function seedPartnerCompanies() {
  console.log('🏢 Seeding partner companies...')
  const partners = [
    {
      company_name: 'Công ty Du Lịch Hà Nội ABC',
      contact_name: 'Nguyễn Thị Lan',
      phone: '024 3812 5678',
      email: 'info@hanoiabc.vn',
      address: '15 Tràng Thi, Hoàn Kiếm, Hà Nội',
      tax_code: '0100100100',
      notes: 'Đối tác truyền thống, thanh toán đúng hạn',
      is_active: true,
    },
    {
      company_name: 'Saigon Travel Group',
      contact_name: 'Trần Văn Nam',
      phone: '028 3812 9999',
      email: 'booking@saigontravelgroup.com',
      address: '100 Nguyễn Huệ, Quận 1, TP.HCM',
      tax_code: '0300300300',
      notes: 'Booking nhiều tour miền Nam, thường đặt xe 45 chỗ',
      is_active: true,
    },
    {
      company_name: 'Vietnam Eco Tours',
      contact_name: 'Lê Thị Hoa',
      phone: '0236 3812 7777',
      email: 'office@viecotours.com',
      address: '45 Bạch Đằng, Hải Châu, Đà Nẵng',
      tax_code: '0400400400',
      notes: 'Chuyên tour sinh thái miền Trung',
      is_active: true,
    },
  ]

  const { error } = await supabase.from('partner_companies').upsert(partners, { onConflict: 'company_name' })
  if (error) throw new Error(`Partners: ${error.message}`)
  console.log(`  ✅ ${partners.length} partner companies`)
}

async function seedBookingsAndAssignments() {
  console.log('📝 Seeding bookings & assignments...')

  const { data: partners } = await supabase
    .from('partner_companies')
    .select('id, company_name')
    .limit(3)

  const partnerId = partners?.[0]?.id ?? null

  type BookingSeed = {
    booking_code: string
    group_name: string
    email: string
    phone: string
    passenger_count: number
    vehicle_type: string
    start_date: string
    end_date: string
    pickup_location: string
    dropoff_location: string
    unit_price: number
    total_km: number
    total_extra: number
    total_amount: number
    booking_source: string
    partner_company_id: string | null
    notes: string
  }

  const bookings: BookingSeed[] = [
    {
      booking_code: 'BK2025001',
      group_name: 'Đoàn Hà Nội – Hạ Long',
      email: 'contact@hngroup.com',
      phone: '0912 000 001',
      passenger_count: 25,
      vehicle_type: '29',
      start_date: addDays(today(), -15),
      end_date: addDays(today(), -13),
      pickup_location: 'Hà Nội (Hồ Gươm)',
      dropoff_location: 'Hạ Long Bay Resort',
      unit_price: 3500000,
      total_km: 380,
      total_extra: 200000,
      total_amount: 7200000,
      booking_source: 'direct',
      partner_company_id: null,
      notes: 'Đoàn khách cơ quan',
    },
    {
      booking_code: 'BK2025002',
      group_name: 'Saigon Travel – Sapa Tour',
      email: 'booking@saigontravelgroup.com',
      phone: '028 3812 9999',
      passenger_count: 40,
      vehicle_type: '45',
      start_date: addDays(today(), -10),
      end_date: addDays(today(), -7),
      pickup_location: 'Hà Nội (Mỹ Đình)',
      dropoff_location: 'Sapa – Lào Cai',
      unit_price: 8000000,
      total_km: 720,
      total_extra: 500000,
      total_amount: 24500000,
      booking_source: 'partner',
      partner_company_id: partners?.[1]?.id ?? partnerId,
      notes: 'Tour 3 ngày – thanh toán 70% trước',
    },
    {
      booking_code: 'BK2025003',
      group_name: 'Gia đình Nguyễn',
      email: 'nguyen.family@gmail.com',
      phone: '0988 123 456',
      passenger_count: 5,
      vehicle_type: '7',
      start_date: addDays(today(), -5),
      end_date: addDays(today(), -4),
      pickup_location: 'Phố cổ Hà Nội',
      dropoff_location: 'Ninh Bình',
      unit_price: 2000000,
      total_km: 180,
      total_extra: 0,
      total_amount: 4000000,
      booking_source: 'direct',
      partner_company_id: null,
      notes: '',
    },
    {
      booking_code: 'BK2025004',
      group_name: 'ABC Travel – Hải Phòng',
      email: 'info@hanoiabc.vn',
      phone: '024 3812 5678',
      passenger_count: 15,
      vehicle_type: '16',
      start_date: addDays(today(), 2),
      end_date: addDays(today(), 3),
      pickup_location: 'Hà Nội (Trần Duy Hưng)',
      dropoff_location: 'Hải Phòng – Đồ Sơn',
      unit_price: 2500000,
      total_km: 220,
      total_extra: 100000,
      total_amount: 5100000,
      booking_source: 'partner',
      partner_company_id: partnerId,
      notes: 'Cần xe đầy đủ tiện nghi',
    },
    {
      booking_code: 'BK2025005',
      group_name: 'Đoàn Công Ty XYZ',
      email: 'hr@xyz-corp.vn',
      phone: '024 3999 8888',
      passenger_count: 28,
      vehicle_type: '29',
      start_date: addDays(today(), 5),
      end_date: addDays(today(), 7),
      pickup_location: 'Hà Nội (Cầu Giấy)',
      dropoff_location: 'Đà Nẵng',
      unit_price: 5000000,
      total_km: 1100,
      total_extra: 800000,
      total_amount: 15800000,
      booking_source: 'direct',
      partner_company_id: null,
      notes: 'Team building 3 ngày, cần ga CK sân bay',
    },
    {
      booking_code: 'BK2025006',
      group_name: 'Vietnam Eco – Phong Nha',
      email: 'office@viecotours.com',
      phone: '0236 3812 7777',
      passenger_count: 8,
      vehicle_type: '9',
      start_date: addDays(today(), 10),
      end_date: addDays(today(), 12),
      pickup_location: 'Đà Nẵng',
      dropoff_location: 'Phong Nha – Kẻ Bàng',
      unit_price: 2200000,
      total_km: 450,
      total_extra: 300000,
      total_amount: 6900000,
      booking_source: 'partner',
      partner_company_id: partners?.[2]?.id ?? partnerId,
      notes: 'Tour sinh thái, cần tài xế biết đường',
    },
  ]

  // Insert bookings
  const { data: insertedBookings, error: bookingError } = await supabase
    .from('bookings')
    .upsert(bookings, { onConflict: 'booking_code' })
    .select('id, booking_code, start_date, end_date, vehicle_type')

  if (bookingError) throw new Error(`Bookings: ${bookingError.message}`)
  console.log(`  ✅ ${insertedBookings?.length ?? 0} bookings`)

  // Get vehicle & driver IDs
  const { data: vehicles } = await supabase.from('vehicles').select('id, plate_number, vehicle_name, seat_count').eq('is_active', true)
  const { data: drivers } = await supabase.from('drivers').select('id, full_name').eq('is_active', true)

  if (!insertedBookings || !vehicles || !drivers) return

  const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.seat_count, v]))
  const getDriver = (i: number) => drivers[i % drivers.length]

  type AssignmentSeed = {
    booking_id: string
    booking_code: string
    group_name: string
    start_date: string
    end_date: string
    vehicle_type: string | null
    vehicle_id: string | null
    vehicle_assigned: string | null
    driver_id: string | null
    driver_assigned: string | null
    status: string
  }

  const assignments: AssignmentSeed[] = insertedBookings.map((b, i) => {
    const seat = Number(b.vehicle_type)
    const vehicle = vehicleMap[seat] ?? vehicles[i % vehicles.length]
    const driver = getDriver(i)

    const statuses = ['completed', 'completed', 'completed', 'confirmed', 'assigned', 'pending']
    const status = statuses[i] ?? 'pending'

    return {
      booking_id: b.id,
      booking_code: b.booking_code,
      group_name: (bookings.find((bk) => bk.booking_code === b.booking_code)?.group_name) ?? '',
      start_date: b.start_date,
      end_date: b.end_date,
      vehicle_type: b.vehicle_type,
      vehicle_id: vehicle?.id ?? null,
      vehicle_assigned: vehicle ? `${vehicle.vehicle_name} (${vehicle.plate_number})` : null,
      driver_id: driver?.id ?? null,
      driver_assigned: driver?.full_name ?? null,
      status,
    }
  })

  const { error: assignmentError } = await supabase
    .from('assignments')
    .upsert(assignments, { onConflict: 'booking_code' })

  if (assignmentError) throw new Error(`Assignments: ${assignmentError.message}`)
  console.log(`  ✅ ${assignments.length} assignments`)
}

async function seedServicePackages() {
  console.log('🧭 Seeding service packages...')

  const packages = [
    {
      name: 'Hà Nội – Hạ Long 2N1Đ (7 chỗ)',
      vehicle_type: '7',
      duration_days: 2,
      base_price: 3500000,
      description: 'Tour 2 ngày 1 đêm, khởi hành Hà Nội, tham quan Vịnh Hạ Long',
    },
    {
      name: 'Hà Nội – Sapa 3N2Đ (29 chỗ)',
      vehicle_type: '29',
      duration_days: 3,
      base_price: 7500000,
      description: 'Tour nhóm đông đến Sapa, khởi hành từ Hà Nội',
    },
    {
      name: 'Hà Nội – Ninh Bình 1 ngày (16 chỗ)',
      vehicle_type: '16',
      duration_days: 1,
      base_price: 2200000,
      description: 'Tour ngày, tham quan Tràng An – Bái Đính',
    },
    {
      name: 'Đưa đón sân bay Nội Bài (5 chỗ)',
      vehicle_type: '5',
      duration_days: 1,
      base_price: 450000,
      description: 'Dịch vụ đưa đón sân bay Nội Bài, phục vụ 24/7',
    },
    {
      name: 'Thuê xe tháng (7 chỗ)',
      vehicle_type: '7',
      duration_days: 30,
      base_price: 35000000,
      description: 'Cho thuê xe có lái theo tháng, phù hợp doanh nghiệp',
    },
  ]

  const { error } = await supabase.from('service_packages').upsert(packages, { onConflict: 'name' })
  if (error) throw new Error(`Service packages: ${error.message}`)
  console.log(`  ✅ ${packages.length} service packages`)
}

async function seedAppSettings() {
  console.log('⚙️  Seeding app settings (demo values)...')

  const settings = [
    { key: 'company_name', value: 'CÔNG TY TNHH VẬN TẢI DEMO' },
    { key: 'company_short_name', value: 'Demo Transport' },
    { key: 'company_address', value: '123 Đường Demo, Quận 1, TP.HCM' },
    { key: 'company_phone', value: '028 1234 5678' },
    { key: 'company_hotline', value: '0900 123 456' },
    { key: 'company_email', value: 'info@demotransport.vn' },
    { key: 'company_website', value: 'www.demotransport.vn' },
    { key: 'company_tax_code', value: '0123456789' },
    { key: 'app_name', value: 'Demo Transport — Quản Lý Vận Tải' },
    { key: 'app_description', value: 'Hệ thống điều hành vận tải nội bộ' },
  ]

  const { error } = await supabase.from('app_settings').upsert(settings, { onConflict: 'key' })
  if (error) throw new Error(`App settings: ${error.message}`)
  console.log(`  ✅ ${settings.length} settings`)
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Starting demo data seed...\n')

  try {
    await seedVehicles()
    await seedDrivers()
    await seedPartnerCompanies()
    await seedBookingsAndAssignments()
    await seedServicePackages()
    await seedAppSettings()

    console.log('\n✅ Demo data seeded successfully!')
    console.log('   → Login with your admin account and explore the app.')
    console.log('   → Visit /settings to update company info.')
  } catch (err) {
    console.error('\n❌ Seed failed:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

main()
