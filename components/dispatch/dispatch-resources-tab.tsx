'use client'

import { useEffect, useMemo, useState } from 'react'

type VehicleRecord = {
  id: string
  plate_number: string
  vehicle_name: string | null
  seat_count: number | null
  is_active: boolean
}

type DriverRecord = {
  id: string
  full_name: string
  phone: string | null
  is_active: boolean
}

type ResourcesResponse = {
  vehicles: VehicleRecord[]
  drivers: DriverRecord[]
}

type SaveVehiclePayload = {
  resourceType: 'vehicle'
  mode: 'create' | 'update'
  id?: string
  plate_number: string
  vehicle_name: string
  seat_count: number
  is_active: boolean
}

type SaveDriverPayload = {
  resourceType: 'driver'
  mode: 'create' | 'update'
  id?: string
  full_name: string
  phone: string
  is_active: boolean
}

type CsvImportRowError = {
  rowNumber: number
  message: string
}

type CsvImportPreviewRow = Record<string, string>

type CsvImportResult = {
  success: boolean
  resourceType: 'vehicle' | 'driver'
  totalRows: number
  importedCount: number
  skippedCount: number
  errors: CsvImportRowError[]
}

function emptyVehicleForm(): SaveVehiclePayload {
  return {
    resourceType: 'vehicle',
    mode: 'create',
    plate_number: '',
    vehicle_name: '',
    seat_count: 16,
    is_active: true,
  }
}

function emptyDriverForm(): SaveDriverPayload {
  return {
    resourceType: 'driver',
    mode: 'create',
    full_name: '',
    phone: '',
    is_active: true,
  }
}

function parseCsvText(text: string): CsvImportPreviewRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const headers = lines[0].split(',').map((item) => item.trim())
  const rows: CsvImportPreviewRow[] = []

  for (let i = 1; i < lines.length; i += 1) {
    const values = lines[i].split(',').map((item) => item.trim())
    const row: CsvImportPreviewRow = {}

    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    rows.push(row)
  }

  return rows
}

async function readCsvFileWithEncoding(file: File) {
  const buffer = await file.arrayBuffer()
  const utf8Decoder = new TextDecoder('utf-8', { fatal: false })
  const utf8Text = utf8Decoder.decode(buffer)

  const hasReplacementChar = utf8Text.includes('�')

  if (!hasReplacementChar) {
    return utf8Text.replace(/^\uFEFF/, '')
  }

  try {
    const win1258Decoder = new TextDecoder('windows-1258', { fatal: false })
    const win1258Text = win1258Decoder.decode(buffer)
    return win1258Text.replace(/^\uFEFF/, '')
  } catch {
    return utf8Text.replace(/^\uFEFF/, '')
  }
}

function escapeCsvValue(value: string | number | boolean | null | undefined) {
  const normalized = String(value ?? '')
  const escaped = normalized.replace(/"/g, '""')
  return `"${escaped}"`
}

function downloadCsvFile(filename: string, content: string) {
  const bom = '\uFEFF'
  const blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

function buildVehiclesCsv(rows: VehicleRecord[]) {
  const headers = ['plate_number', 'vehicle_name', 'seat_count', 'is_active']
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      [
        escapeCsvValue(row.plate_number),
        escapeCsvValue(row.vehicle_name || ''),
        escapeCsvValue(row.seat_count || 0),
        escapeCsvValue(row.is_active),
      ].join(','),
    ),
  ]

  return lines.join('\n')
}

function buildDriversCsv(rows: DriverRecord[]) {
  const headers = ['full_name', 'phone', 'is_active']
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      [
        escapeCsvValue(row.full_name),
        escapeCsvValue(row.phone || ''),
        escapeCsvValue(row.is_active),
      ].join(','),
    ),
  ]

  return lines.join('\n')
}

function getVehicleSeatColor(seatCount?: number | null) {
  switch (String(seatCount ?? '').trim()) {
    case '5':
      return '#ec4899'
    case '7':
      return '#3b82f6'
    case '9':
      return '#06b6d4'
    case '16':
      return '#10b981'
    case '29':
      return '#f59e0b'
    case '45':
      return '#8b5cf6'
    default:
      return '#94a3b8'
  }
}

const VEHICLE_SEAT_LEGEND = [
  { value: 5, label: '5 chỗ' },
  { value: 7, label: '7 chỗ' },
  { value: 9, label: '9 chỗ' },
  { value: 16, label: '16 chỗ' },
  { value: 29, label: '29 chỗ' },
  { value: 45, label: '45 chỗ' },
  { value: 0, label: 'Khác / chưa rõ' },
]

export default function DispatchResourcesTab() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([])
  const [drivers, setDrivers] = useState<DriverRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState('')

  const [vehicleForm, setVehicleForm] = useState<SaveVehiclePayload>(emptyVehicleForm())
  const [driverForm, setDriverForm] = useState<SaveDriverPayload>(emptyDriverForm())

  const [savingVehicle, setSavingVehicle] = useState(false)
  const [savingDriver, setSavingDriver] = useState(false)
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null)
  const [deletingDriverId, setDeletingDriverId] = useState<string | null>(null)

  const [vehicleCsvName, setVehicleCsvName] = useState('')
  const [driverCsvName, setDriverCsvName] = useState('')
  const [vehicleCsvRows, setVehicleCsvRows] = useState<CsvImportPreviewRow[]>([])
  const [driverCsvRows, setDriverCsvRows] = useState<CsvImportPreviewRow[]>([])
  const [importingVehicleCsv, setImportingVehicleCsv] = useState(false)
  const [importingDriverCsv, setImportingDriverCsv] = useState(false)
  const [vehicleImportResult, setVehicleImportResult] = useState<CsvImportResult | null>(null)
  const [driverImportResult, setDriverImportResult] = useState<CsvImportResult | null>(null)
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [showDriverForm, setShowDriverForm] = useState(false)
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [driverSearch, setDriverSearch] = useState('')

  async function loadResources() {
    try {
      setLoading(true)
      setErrorText('')

      const res = await fetch('/api/dispatch/resources', {
        cache: 'no-store',
      })
      const json = (await res.json().catch(() => null)) as ResourcesResponse | null

      if (!res.ok) {
        throw new Error((json as { error?: string } | null)?.error || 'Cannot load resources')
      }

      setVehicles(Array.isArray(json?.vehicles) ? json.vehicles : [])
      setDrivers(Array.isArray(json?.drivers) ? json.drivers : [])
    } catch (error) {
      console.error(error)
      setVehicles([])
      setDrivers([])
      setErrorText(error instanceof Error ? error.message : 'Cannot load resources')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadResources()
  }, [])

  const vehicleDuplicatePreview = useMemo(() => {
    const normalized = vehicleForm.plate_number.replace(/\s+/g, '').trim().toUpperCase()
    if (!normalized) return false

    return vehicles.some((item) => {
      if (vehicleForm.mode === 'update' && item.id === vehicleForm.id) return false
      return item.plate_number.replace(/\s+/g, '').trim().toUpperCase() === normalized
    })
  }, [vehicleForm, vehicles])

  const driverDuplicatePreview = useMemo(() => {
    const normalized = driverForm.phone.replace(/\D/g, '')
    if (!normalized) return false

    return drivers.some((item) => {
      if (driverForm.mode === 'update' && item.id === driverForm.id) return false
      return (item.phone || '').replace(/\D/g, '') === normalized
    })
  }, [driverForm, drivers])

  const filteredVehicles = useMemo(() => {
    const keyword = vehicleSearch.trim().toLowerCase()
    if (!keyword) return vehicles

    return vehicles.filter((item) => {
      const haystack = [
        item.plate_number,
        item.vehicle_name || '',
        String(item.seat_count || ''),
        item.is_active ? 'active' : 'inactive',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(keyword)
    })
  }, [vehicleSearch, vehicles])

  const filteredDrivers = useMemo(() => {
    const keyword = driverSearch.trim().toLowerCase()
    if (!keyword) return drivers

    return drivers.filter((item) => {
      const haystack = [
        item.full_name,
        item.phone || '',
        item.is_active ? 'active' : 'inactive',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(keyword)
    })
  }, [driverSearch, drivers])

  function startCreateVehicle() {
    setVehicleForm(emptyVehicleForm())
    setShowVehicleForm(true)
  }

  function startEditVehicle(item: VehicleRecord) {
    setVehicleForm({
      resourceType: 'vehicle',
      mode: 'update',
      id: item.id,
      plate_number: item.plate_number,
      vehicle_name: item.vehicle_name || '',
      seat_count: Number(item.seat_count || 0),
      is_active: item.is_active,
    })
    setShowVehicleForm(true)
  }

  function startCreateDriver() {
    setDriverForm(emptyDriverForm())
    setShowDriverForm(true)
  }

  function startEditDriver(item: DriverRecord) {
    setDriverForm({
      resourceType: 'driver',
      mode: 'update',
      id: item.id,
      full_name: item.full_name,
      phone: item.phone || '',
      is_active: item.is_active,
    })
    setShowDriverForm(true)
  }

  function cancelVehicleForm() {
    setVehicleForm(emptyVehicleForm())
    setShowVehicleForm(false)
  }

  function cancelDriverForm() {
    setDriverForm(emptyDriverForm())
    setShowDriverForm(false)
  }

  async function saveVehicle() {
    if (!vehicleForm.plate_number.trim()) {
      alert('Vehicle plate number is required')
      return
    }

    if (vehicleDuplicatePreview) {
      alert('Duplicate vehicle plate number')
      return
    }

    try {
      setSavingVehicle(true)

      const method = vehicleForm.mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch('/api/dispatch/resources', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleForm),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Cannot save vehicle')
      }

      await loadResources()
      setVehicleForm(emptyVehicleForm())
      setShowVehicleForm(false)
      alert(vehicleForm.mode === 'create' ? 'Vehicle created' : 'Vehicle updated')
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Cannot save vehicle')
    } finally {
      setSavingVehicle(false)
    }
  }

  async function saveDriver() {
    if (!driverForm.full_name.trim()) {
      alert('Driver full name is required')
      return
    }

    if (!driverForm.phone.trim()) {
      alert('Driver phone is required')
      return
    }

    if (driverDuplicatePreview) {
      alert('Duplicate driver phone number')
      return
    }

    try {
      setSavingDriver(true)

      const method = driverForm.mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch('/api/dispatch/resources', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverForm),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Cannot save driver')
      }

      await loadResources()
      setDriverForm(emptyDriverForm())
      setShowDriverForm(false)
      alert(driverForm.mode === 'create' ? 'Driver created' : 'Driver updated')
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Cannot save driver')
    } finally {
      setSavingDriver(false)
    }
  }

  async function deleteVehicle(item: VehicleRecord) {
    const ok = window.confirm(`Delete vehicle ${item.plate_number}?`)
    if (!ok) return

    try {
      setDeletingVehicleId(item.id)

      const res = await fetch('/api/dispatch/resources', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceType: 'vehicle',
          id: item.id,
        }),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Cannot delete vehicle')
      }

      if (vehicleForm.id === item.id) {
        setVehicleForm(emptyVehicleForm())
        setShowVehicleForm(false)
      }

      await loadResources()
      alert('Vehicle deleted')
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Cannot delete vehicle')
    } finally {
      setDeletingVehicleId(null)
    }
  }

  async function deleteDriver(item: DriverRecord) {
    const ok = window.confirm(`Delete driver ${item.full_name}?`)
    if (!ok) return

    try {
      setDeletingDriverId(item.id)

      const res = await fetch('/api/dispatch/resources', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceType: 'driver',
          id: item.id,
        }),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Cannot delete driver')
      }

      if (driverForm.id === item.id) {
        setDriverForm(emptyDriverForm())
        setShowDriverForm(false)
      }

      await loadResources()
      alert('Driver deleted')
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Cannot delete driver')
    } finally {
      setDeletingDriverId(null)
    }
  }

  async function handleCsvFile(
    event: React.ChangeEvent<HTMLInputElement>,
    resourceType: 'vehicle' | 'driver',
  ) {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await readCsvFileWithEncoding(file)
    const rows = parseCsvText(text)

    if (resourceType === 'vehicle') {
      setVehicleCsvName(file.name)
      setVehicleCsvRows(rows)
      setVehicleImportResult(null)
      return
    }

    setDriverCsvName(file.name)
    setDriverCsvRows(rows)
    setDriverImportResult(null)
  }

  async function importCsv(resourceType: 'vehicle' | 'driver') {
    try {
      if (resourceType === 'vehicle') {
        if (vehicleCsvRows.length === 0) {
          alert('No vehicle CSV data to import')
          return
        }

        setImportingVehicleCsv(true)

        const res = await fetch('/api/dispatch/resources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceType: 'vehicle',
            mode: 'import',
            rows: vehicleCsvRows,
          }),
        })

        const json = (await res.json().catch(() => null)) as
          | CsvImportResult
          | { error?: string }
          | null

        if (!res.ok) {
          throw new Error(
            (json as { error?: string } | null)?.error || 'Vehicle CSV import failed',
          )
        }

        setVehicleImportResult(json as CsvImportResult)
        await loadResources()
        return
      }

      if (driverCsvRows.length === 0) {
        alert('No driver CSV data to import')
        return
      }

      setImportingDriverCsv(true)

      const res = await fetch('/api/dispatch/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceType: 'driver',
          mode: 'import',
          rows: driverCsvRows,
        }),
      })

      const json = (await res.json().catch(() => null)) as
        | CsvImportResult
        | { error?: string }
        | null

      if (!res.ok) {
        throw new Error(
          (json as { error?: string } | null)?.error || 'Driver CSV import failed',
        )
      }

      setDriverImportResult(json as CsvImportResult)
      await loadResources()
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'CSV import failed')
    } finally {
      setImportingVehicleCsv(false)
      setImportingDriverCsv(false)
    }
  }

  function exportVehiclesCsv() {
    if (vehicles.length === 0) {
      alert('No vehicles to export')
      return
    }

    const content = buildVehiclesCsv(vehicles)
    downloadCsvFile('vehicles-export.csv', content)
  }

  function exportDriversCsv() {
    if (drivers.length === 0) {
      alert('No drivers to export')
      return
    }

    const content = buildDriversCsv(drivers)
    downloadCsvFile('drivers-export.csv', content)
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {loading && <div className="section-card">Loading vehicles and drivers...</div>}

      {!loading && errorText && (
        <div className="section-card" style={{ color: 'crimson' }}>
          {errorText}
        </div>
      )}

      {!loading && !errorText && (
        <div className="grid-2">
          <div className="section-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <h3 className="section-title" style={{ marginBottom: 0 }}>
                Vehicle list
              </h3>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={exportVehiclesCsv}
                >
                  Export CSV
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (showVehicleForm && vehicleForm.mode === 'create') {
                      cancelVehicleForm()
                      return
                    }
                    startCreateVehicle()
                  }}
                >
                  {showVehicleForm && vehicleForm.mode === 'create'
                    ? 'Ẩn form tạo xe'
                    : 'Create vehicle'}
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 16,
              }}
            >
              {VEHICLE_SEAT_LEGEND.map((item) => (
                <div
                  key={`${item.value}-${item.label}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: '#f8fafc',
                    border: '1px solid #e5e7eb',
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 999,
                      display: 'inline-block',
                      background: getVehicleSeatColor(item.value || null),
                    }}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                className="input"
                placeholder="Search plate number, vehicle name, seat count..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
              />
              <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
                {filteredVehicles.length}/{vehicles.length} vehicles
              </div>
            </div>

            {showVehicleForm && (
              <div
                style={{
                  marginBottom: 20,
                  padding: 16,
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  background: '#f8fafc',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    {vehicleForm.mode === 'create' ? 'Create vehicle' : 'Update vehicle'}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cancelVehicleForm}
                  >
                    Đóng
                  </button>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label className="label">Plate number</label>
                    <input
                      className="input"
                      value={vehicleForm.plate_number}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          plate_number: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label className="label">Vehicle name</label>
                    <input
                      className="input"
                      value={vehicleForm.vehicle_name}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          vehicle_name: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label className="label">Seat count</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={vehicleForm.seat_count}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          seat_count: Number(e.target.value || 0),
                        }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label className="label">Active</label>
                    <select
                      className="select"
                      value={vehicleForm.is_active ? 'true' : 'false'}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          is_active: e.target.value === 'true',
                        }))
                      }
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                {vehicleDuplicatePreview && (
                  <div style={{ marginTop: 12, color: '#b45309' }}>
                    Duplicate warning: this plate number already exists.
                  </div>
                )}

                <div className="actions" style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={saveVehicle}
                    disabled={savingVehicle}
                  >
                    {savingVehicle
                      ? 'Saving...'
                      : vehicleForm.mode === 'create'
                        ? 'Create vehicle'
                        : 'Update vehicle'}
                  </button>
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: 20,
                padding: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 10,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                Import vehicles from CSV
              </div>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleCsvFile(e, 'vehicle')}
              />
              {vehicleCsvName && <div style={{ marginTop: 8 }}>Selected file: {vehicleCsvName}</div>}
              {vehicleCsvRows.length > 0 && (
                <div style={{ marginTop: 8 }}>Preview rows: {vehicleCsvRows.length}</div>
              )}
              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => importCsv('vehicle')}
                  disabled={importingVehicleCsv || vehicleCsvRows.length === 0}
                >
                  {importingVehicleCsv ? 'Importing...' : 'Import vehicles CSV'}
                </button>
              </div>

              {vehicleImportResult && (
                <div style={{ marginTop: 12 }}>
                  <div>Total rows: {vehicleImportResult.totalRows}</div>
                  <div>Imported: {vehicleImportResult.importedCount}</div>
                  <div>Skipped: {vehicleImportResult.skippedCount}</div>
                  {vehicleImportResult.errors.length > 0 && (
                    <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                      {vehicleImportResult.errors.map((item, index) => (
                        <li key={`vehicle-import-error-${index}`}>
                          Row {item.rowNumber}: {item.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: 20, overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Plate</th>
                    <th>Name</th>
                    <th>Seats</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((item) => (
                    <tr key={item.id}>
                      <td>{item.plate_number}</td>
                      <td>{item.vehicle_name || '-'}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            fontWeight: 700,
                            color: getVehicleSeatColor(item.seat_count),
                          }}
                        >
                          <span
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 999,
                              display: 'inline-block',
                              background: getVehicleSeatColor(item.seat_count),
                            }}
                          />
                          <span>{item.seat_count || 0}</span>
                        </span>
                      </td>
                      <td>{item.is_active ? 'Active' : 'Inactive'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => startEditVehicle(item)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => deleteVehicle(item)}
                            disabled={deletingVehicleId === item.id}
                          >
                            {deletingVehicleId === item.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredVehicles.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        {vehicleSearch.trim() ? 'No vehicles match your search.' : 'No vehicles found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="section-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <h3 className="section-title" style={{ marginBottom: 0 }}>
                Driver list
              </h3>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={exportDriversCsv}
                >
                  Export CSV
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (showDriverForm && driverForm.mode === 'create') {
                      cancelDriverForm()
                      return
                    }
                    startCreateDriver()
                  }}
                >
                  {showDriverForm && driverForm.mode === 'create'
                    ? 'Ẩn form tạo lái xe'
                    : 'Create driver'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                className="input"
                placeholder="Search full name, phone, status..."
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
              />
              <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
                {filteredDrivers.length}/{drivers.length} drivers
              </div>
            </div>

            {showDriverForm && (
              <div
                style={{
                  marginBottom: 20,
                  padding: 16,
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  background: '#f8fafc',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    {driverForm.mode === 'create' ? 'Create driver' : 'Update driver'}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cancelDriverForm}
                  >
                    Đóng
                  </button>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label className="label">Full name</label>
                    <input
                      className="input"
                      value={driverForm.full_name}
                      onChange={(e) =>
                        setDriverForm((prev) => ({
                          ...prev,
                          full_name: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label className="label">Phone</label>
                    <input
                      className="input"
                      value={driverForm.phone}
                      onChange={(e) =>
                        setDriverForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label className="label">Active</label>
                    <select
                      className="select"
                      value={driverForm.is_active ? 'true' : 'false'}
                      onChange={(e) =>
                        setDriverForm((prev) => ({
                          ...prev,
                          is_active: e.target.value === 'true',
                        }))
                      }
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                {driverDuplicatePreview && (
                  <div style={{ marginTop: 12, color: '#b45309' }}>
                    Duplicate warning: this phone number already exists.
                  </div>
                )}

                <div className="actions" style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={saveDriver}
                    disabled={savingDriver}
                  >
                    {savingDriver
                      ? 'Saving...'
                      : driverForm.mode === 'create'
                        ? 'Create driver'
                        : 'Update driver'}
                  </button>
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: 20,
                padding: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 10,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                Import drivers from CSV
              </div>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleCsvFile(e, 'driver')}
              />
              {driverCsvName && <div style={{ marginTop: 8 }}>Selected file: {driverCsvName}</div>}
              {driverCsvRows.length > 0 && (
                <div style={{ marginTop: 8 }}>Preview rows: {driverCsvRows.length}</div>
              )}
              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => importCsv('driver')}
                  disabled={importingDriverCsv || driverCsvRows.length === 0}
                >
                  {importingDriverCsv ? 'Importing...' : 'Import drivers CSV'}
                </button>
              </div>

              {driverImportResult && (
                <div style={{ marginTop: 12 }}>
                  <div>Total rows: {driverImportResult.totalRows}</div>
                  <div>Imported: {driverImportResult.importedCount}</div>
                  <div>Skipped: {driverImportResult.skippedCount}</div>
                  {driverImportResult.errors.length > 0 && (
                    <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                      {driverImportResult.errors.map((item, index) => (
                        <li key={`driver-import-error-${index}`}>
                          Row {item.rowNumber}: {item.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: 20, overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Full name</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((item) => (
                    <tr key={item.id}>
                      <td>{item.full_name}</td>
                      <td>{item.phone || '-'}</td>
                      <td>{item.is_active ? 'Active' : 'Inactive'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => startEditDriver(item)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => deleteDriver(item)}
                            disabled={deletingDriverId === item.id}
                          >
                            {deletingDriverId === item.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDrivers.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        {driverSearch.trim() ? 'No drivers match your search.' : 'No drivers found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
