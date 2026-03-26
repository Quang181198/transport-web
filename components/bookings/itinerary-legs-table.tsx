'use client'

import { useState } from 'react'
import { formatVND, parseVND } from '@/components/utils/currency'
import type { BookingLegInput } from '../../lib/types/transport'

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

export type Leg = BookingLegInput

type Props = {
  legs: Leg[]
  onChange: (legs: Leg[]) => void
}

function createEmptyLeg(seqNo: number): Leg {
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

export default function ItineraryLegsTable({ legs, onChange }: Props) {
  const [editingExtraIndex, setEditingExtraIndex] = useState<number | null>(null)
  const [extraDrafts, setExtraDrafts] = useState<Record<number, string>>({})
  const [dateDrafts, setDateDrafts] = useState<Record<number, string>>({})
  const timeOptions = getTimeOptions()

  function update(index: number, key: keyof Leg, value: string | number) {
    const next = [...legs]
    next[index] = { ...next[index], [key]: value }
    onChange(next)
  }

  function add() {
    onChange([...legs, createEmptyLeg(legs.length + 1)])
  }

  function remove(index: number) {
    const next = legs
      .filter((_, i) => i !== index)
      .map((leg, i) => ({
        ...leg,
        seqNo: i + 1,
      }))

    onChange(next.length > 0 ? next : [createEmptyLeg(1)])

    setExtraDrafts((prev) => {
      const copied = { ...prev }
      delete copied[index]
      return copied
    })

    setDateDrafts((prev) => {
      const copied = { ...prev }
      delete copied[index]
      return copied
    })

    if (editingExtraIndex === index) {
      setEditingExtraIndex(null)
    }
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Ngày</th>
            <th>Giờ đón</th>
            <th>Giờ trả</th>
            <th>Lịch trình</th>
            <th>Km</th>
            <th>Ghi chú</th>
            <th>Phát sinh thêm</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {legs.map((leg, i) => {
            const isEditing = editingExtraIndex === i
            const displayValue = isEditing
              ? (extraDrafts[i] ?? (leg.extraAmount > 0 ? String(leg.extraAmount) : ''))
              : formatVND(leg.extraAmount)

            return (
              <tr key={i}>
                <td>{leg.seqNo}</td>

                <td>
                  <input
                    className="input"
                    type="text"
                    placeholder="dd/mm/yyyy"
                    value={
                      dateDrafts[i] !== undefined
                        ? dateDrafts[i]
                        : formatDateVN(leg.tripDate)
                    }
                    onFocus={() => {
                      setDateDrafts((prev) => ({
                        ...prev,
                        [i]: leg.tripDate || '',
                      }))
                    }}
                    onChange={(e) => {
                      const raw = e.target.value

                      setDateDrafts((prev) => ({
                        ...prev,
                        [i]: raw,
                      }))

                      const parsed = parseDateVN(raw)
                      if (parsed) {
                        update(i, 'tripDate', parsed)
                      } else if (raw.trim() === '') {
                        update(i, 'tripDate', '')
                      }
                    }}
                    onBlur={() => {
                      setDateDrafts((prev) => ({
                        ...prev,
                        [i]: formatDateVN(leg.tripDate),
                      }))
                    }}
                  />
                </td>

                <td>
                  <select
                    className="select"
                    value={leg.pickupTime || ''}
                    onChange={(e) => update(i, 'pickupTime', e.target.value)}
                  >
                    <option value="">-- Chọn giờ --</option>
                    {timeOptions.map((time) => (
                      <option key={`pickup-${i}-${time}`} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  <select
                    className="select"
                    value={leg.dropoffTime || ''}
                    onChange={(e) => update(i, 'dropoffTime', e.target.value)}
                  >
                    <option value="">-- Chọn giờ --</option>
                    {timeOptions.map((time) => (
                      <option key={`dropoff-${i}-${time}`} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  <input
                    className="input"
                    placeholder="Ví dụ: TP.HCM → Vũng Tàu"
                    value={leg.itinerary}
                    onChange={(e) => update(i, 'itinerary', e.target.value)}
                  />
                </td>

                <td>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    placeholder="120"
                    value={leg.distanceKm || ''}
                    onChange={(e) =>
                      update(i, 'distanceKm', Number(e.target.value || 0))
                    }
                  />
                </td>

                <td>
                  <input
                    className="input"
                    placeholder="Ghi chú chặng"
                    value={leg.note}
                    onChange={(e) => update(i, 'note', e.target.value)}
                  />
                </td>

                <td>
                  <input
                    className="input"
                    inputMode="numeric"
                    placeholder="Nhập phát sinh"
                    value={displayValue}
                    onFocus={() => {
                      setEditingExtraIndex(i)
                      setExtraDrafts((prev) => ({
                        ...prev,
                        [i]: leg.extraAmount > 0 ? String(leg.extraAmount) : '',
                      }))
                    }}
                    onChange={(e) => {
                      const raw = e.target.value
                      setExtraDrafts((prev) => ({
                        ...prev,
                        [i]: raw,
                      }))
                      update(i, 'extraAmount', parseVND(raw))
                    }}
                    onBlur={() => {
                      setEditingExtraIndex((prev) => (prev === i ? null : prev))
                      setExtraDrafts((prev) => {
                        const copied = { ...prev }
                        delete copied[i]
                        return copied
                      })
                    }}
                  />
                </td>

                <td>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => remove(i)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div style={{ padding: 14 }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={add}
        >
          + Thêm chặng
        </button>
      </div>
    </div>
  )
}