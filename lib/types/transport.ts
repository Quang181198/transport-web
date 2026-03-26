export type AssignmentStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'canceled'

export type BookingSource = 'direct' | 'partner'

export type ItineraryLegRecord = {
  id?: string
  booking_id?: string
  seq_no: number
  trip_date: string | null
  pickup_time?: string | null
  dropoff_time?: string | null
  itinerary: string | null
  distance_km: number
  note: string | null
  extra_amount: number
}

export type BookingLegInput = {
  seqNo: number
  tripDate: string
  pickupTime: string
  dropoffTime: string
  itinerary: string
  distanceKm: number
  note: string
  extraAmount: number
}

export type BookingCreatePayload = {
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
  legs: BookingLegInput[]
}

export type AssignmentRecord = {
  id: string
  booking_id: string
  booking_code: string
  group_name: string
  start_date: string
  end_date: string
  start_datetime?: string | null
  end_datetime?: string | null
  vehicle_type: string | null
  vehicle_id: string | null
  driver_id: string | null
  vehicle_assigned: string | null
  driver_assigned: string | null
  status: AssignmentStatus
  quotation_pdf_path: string | null
  created_at?: string
  updated_at?: string
}

export type AssignmentWithLegs = AssignmentRecord & {
  legs?: ItineraryLegRecord[]
}

export type VehicleRecord = {
  id: string
  plate_number: string
  vehicle_name: string | null
  seat_count: number
  is_active: boolean
}

export type DriverRecord = {
  id: string
  full_name: string
  phone: string | null
  is_active: boolean
}

export type PartnerCompanyRecord = {
  id: string
  company_name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  tax_code: string | null
  notes: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type CompanyInfo = {
  name: string
  address: string
  phone: string
  hotline?: string
  email?: string
  emailAlt?: string
  website?: string
  taxCode?: string
}

export type QuotationLegPayload = {
  seqNo?: number
  tripDate: string
  pickupTime?: string
  dropoffTime?: string
  itinerary: string
  distanceKm: number
  note: string
  extraAmount: number
}

export type QuotationPayload = {
  bookingCode: string
  groupName: string
  email: string
  phone: string
  passengerCount: number
  vehicleType: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  pickupLocation: string
  dropoffLocation: string
  unitPrice: number
  totalKm: number
  totalExtra: number
  totalAmount: number
  notes: string
  bookingSource?: BookingSource
  partnerCompanyName?: string
  legs: QuotationLegPayload[]
}

export type DispatchOrderLegPayload = {
  seqNo?: number
  tripDate: string
  pickupTime?: string
  dropoffTime?: string
  itinerary: string
  distanceKm?: number
  note: string
}

export type DispatchOrderPayload = {
  bookingCode: string
  groupName: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  vehicleType: string
  vehicleAssigned: string
  driverAssigned: string
  status?: AssignmentStatus | string
  phone?: string
  pickupLocation?: string
  dropoffLocation?: string
  notes?: string
  legs: DispatchOrderLegPayload[]
}