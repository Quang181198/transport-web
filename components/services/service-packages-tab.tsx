'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDialog } from '@/lib/dialog-context'

type ServicePackageListItem = {
  id: string
  name: string
  category: string
  durationDays: number
  vehicleType: string
  isActive: boolean
  sourceUrl: string
  sourceNote: string
  createdAt?: string
}

type ServicePackageLeg = {
  id?: string
  servicePackageId?: string
  seqNo: number
  dayNo: number
  pickupTime: string
  dropoffTime: string
  itinerary: string
  distanceKm: number
  note: string
  extraAmount: number
}

type ServicePackageDetail = ServicePackageListItem & {
  legs: ServicePackageLeg[]
}

type ServicePackagePayload = {
  name: string
  category: string
  durationDays: number
  vehicleType: string
  isActive: boolean
  sourceUrl: string
  sourceNote: string
  legs: ServicePackageLeg[]
}

type SaveMode = 'create' | 'update'

const CATEGORY_OPTIONS = [
  { value: 'du_lich', label: 'Du lịch' },
  { value: 'mien_bac', label: 'Miền Bắc' },
  { value: 'dong_tay_bac', label: 'Đông Tây Bắc' },
  { value: 'du_lich_lao', label: 'Du lịch Lào' },
  { value: 'du_lich_bien', label: 'Du lịch biển' },
  { value: 'le_hoi', label: 'Lễ hội' },
  { value: 'cong_tac', label: 'Công tác' },
  { value: 'cuoi_hoi', label: 'Cưới hỏi' },
  { value: 'hop_dong_dai_han', label: 'Hợp đồng dài hạn' },
]

function getCategoryLabel(value?: string | null) {
  const found = CATEGORY_OPTIONS.find((item) => item.value === value)
  return found?.label || value || 'Chưa phân loại'
}

function getVehicleTypeLabel(vehicleType?: string | null) {
  switch ((vehicleType || '').trim()) {
    case '4':
      return '4 chỗ'
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
    case '35':
      return '35 chỗ'
    case '45':
      return '45 chỗ'
    default:
      return vehicleType || 'Khác / chưa rõ'
  }
}

function createEmptyLeg(seqNo = 1): ServicePackageLeg {
  return {
    seqNo,
    dayNo: seqNo,
    pickupTime: '',
    dropoffTime: '',
    itinerary: '',
    distanceKm: 0,
    note: '',
    extraAmount: 0,
  }
}

function createEmptyForm(): ServicePackagePayload {
  return {
    name: '',
    category: 'du_lich',
    durationDays: 1,
    vehicleType: '16',
    isActive: true,
    sourceUrl: '',
    sourceNote: '',
    legs: [createEmptyLeg(1)],
  }
}

export default function ServicePackagesTab() {
  const { toast, confirm } = useDialog()
  const [list, setList] = useState<ServicePackageListItem[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ServicePackageDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [saveMode, setSaveMode] = useState<SaveMode>('create')
  const [form, setForm] = useState<ServicePackagePayload>(createEmptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchKeyword(searchInput.trim())
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const controller = new AbortController()

    async function loadList() {
      try {
        setLoadingList(true)
        setListError('')

        const params = new URLSearchParams()
        if (searchKeyword) {
          params.set('search', searchKeyword)
        }

        const queryString = params.toString()
        const res = await fetch(
          `/api/service-packages${queryString ? `?${queryString}` : ''}`,
          {
            cache: 'no-store',
            signal: controller.signal,
          },
        )
        const json = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(json?.error || 'Không thể tải danh sách gói dịch vụ')
        }

        const nextList = Array.isArray(json?.data)
          ? (json.data as ServicePackageListItem[])
          : []

        setList(nextList)

        if (selectedId && !nextList.some((item) => item.id === selectedId)) {
          setSelectedId(null)
          setDetail(null)
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        console.error(error)
        setList([])
        setListError(
          error instanceof Error ? error.message : 'Không thể tải danh sách gói dịch vụ',
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoadingList(false)
        }
      }
    }

    void loadList()

    return () => controller.abort()
  }, [searchKeyword, selectedId])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }

    const controller = new AbortController()

    async function loadDetail() {
      try {
        setLoadingDetail(true)

        const res = await fetch(`/api/service-packages/${selectedId}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const json = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(json?.error || 'Không thể tải chi tiết gói dịch vụ')
        }

        setDetail((json?.data || null) as ServicePackageDetail | null)
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        console.error(error)
        setDetail(null)
      } finally {
        if (!controller.signal.aborted) {
          setLoadingDetail(false)
        }
      }
    }

    void loadDetail()

    return () => controller.abort()
  }, [selectedId])

  const summaryText = useMemo(() => {
    if (loadingList) return 'Đang tải gói dịch vụ...'
    return `${list.length} gói dịch vụ`
  }, [list.length, loadingList])

  function updateForm<K extends keyof ServicePackagePayload>(
    key: K,
    value: ServicePackagePayload[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  function updateLeg(index: number, key: keyof ServicePackageLeg, value: string | number) {
    setForm((prev) => {
      const nextLegs = [...prev.legs]
      nextLegs[index] = {
        ...nextLegs[index],
        [key]: value,
      }
      return {
        ...prev,
        legs: nextLegs,
      }
    })
  }

  function addLeg() {
    setForm((prev) => ({
      ...prev,
      legs: [...prev.legs, createEmptyLeg(prev.legs.length + 1)],
    }))
  }

  function removeLeg(index: number) {
    setForm((prev) => {
      const nextLegs = prev.legs
        .filter((_, itemIndex) => itemIndex !== index)
        .map((leg, itemIndex) => ({
          ...leg,
          seqNo: itemIndex + 1,
          dayNo: itemIndex + 1,
        }))

      return {
        ...prev,
        legs: nextLegs.length > 0 ? nextLegs : [createEmptyLeg(1)],
      }
    })
  }

  function startCreate() {
    setSaveMode('create')
    setEditingId(null)
    setForm(createEmptyForm())
    setIsFormOpen(true)
  }

  function startEdit() {
    if (!detail) return

    setSaveMode('update')
    setEditingId(detail.id)
    setForm({
      name: detail.name,
      category: detail.category,
      durationDays: detail.durationDays,
      vehicleType: detail.vehicleType,
      isActive: detail.isActive,
      sourceUrl: detail.sourceUrl,
      sourceNote: detail.sourceNote,
      legs:
        detail.legs.length > 0
          ? detail.legs.map((leg, index) => ({
              id: leg.id,
              servicePackageId: leg.servicePackageId,
              seqNo: index + 1,
              dayNo: Number(leg.dayNo || index + 1),
              pickupTime: leg.pickupTime || '',
              dropoffTime: leg.dropoffTime || '',
              itinerary: leg.itinerary || '',
              distanceKm: Number(leg.distanceKm || 0),
              note: leg.note || '',
              extraAmount: Number(leg.extraAmount || 0),
            }))
          : [createEmptyLeg(1)],
    })
    setIsFormOpen(true)
  }

  function cancelForm() {
    setIsFormOpen(false)
    if (saveMode === 'create') {
      setForm(createEmptyForm())
      setEditingId(null)
    }
  }

  function validateForm() {
    if (!form.name.trim()) return 'Vui lòng nhập tên gói dịch vụ.'
    if (!form.category.trim()) return 'Vui lòng chọn nhóm dịch vụ.'
    if (form.durationDays <= 0) return 'Số ngày phải lớn hơn 0.'

    for (const [index, leg] of form.legs.entries()) {
      if (!leg.itinerary.trim()) {
        return `Vui lòng nhập lịch trình cho chặng ${index + 1}.`
      }

      if (Number(leg.dayNo || 0) <= 0) {
        return `Day no của chặng ${index + 1} phải lớn hơn 0.`
      }

      if (
        leg.pickupTime &&
        leg.dropoffTime &&
        leg.pickupTime > leg.dropoffTime
      ) {
        return `Giờ trả của chặng ${index + 1} không được nhỏ hơn giờ đón.`
      }
    }

    return null
  }

  async function reloadListAndDetail(targetId?: string | null) {
    const params = new URLSearchParams()
    if (searchKeyword) {
      params.set('search', searchKeyword)
    }

    const queryString = params.toString()
    const listRes = await fetch(`/api/service-packages${queryString ? `?${queryString}` : ''}`, {
      cache: 'no-store',
    })
    const listJson = await listRes.json().catch(() => null)

    if (listRes.ok) {
      const nextList = Array.isArray(listJson?.data)
        ? (listJson.data as ServicePackageListItem[])
        : []
      setList(nextList)
    }

    const nextId = targetId ?? selectedId
    if (!nextId) {
      setDetail(null)
      return
    }

    const detailRes = await fetch(`/api/service-packages/${nextId}`, {
      cache: 'no-store',
    })
    const detailJson = await detailRes.json().catch(() => null)

    if (detailRes.ok) {
      setSelectedId(nextId)
      setDetail((detailJson?.data || null) as ServicePackageDetail | null)
    }
  }

  async function savePackage() {
    const validationError = validateForm()
    if (validationError) {
      toast(validationError, 'warning')
      return
    }

    try {
      setSaving(true)

      const method = saveMode === 'create' ? 'POST' : 'PATCH'
      const url =
        saveMode === 'create'
          ? '/api/service-packages'
          : `/api/service-packages/${editingId}`

      const payload = {
        ...form,
        legs: form.legs.map((leg, index) => ({
          id: leg.id,
          seqNo: index + 1,
          dayNo: Number(leg.dayNo || index + 1),
          pickupTime: leg.pickupTime.trim(),
          dropoffTime: leg.dropoffTime.trim(),
          itinerary: leg.itinerary.trim(),
          distanceKm: Number(leg.distanceKm || 0),
          note: leg.note.trim(),
          extraAmount: Number(leg.extraAmount || 0),
        })),
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Không thể lưu gói dịch vụ')
      }

      const nextId = json?.data?.id || editingId || null
      setIsFormOpen(false)
      setSaveMode('create')
      setEditingId(null)
      setForm(createEmptyForm())
      await reloadListAndDetail(nextId)
      toast(saveMode === 'create' ? 'Đã tạo gói dịch vụ' : 'Đã cập nhật gói dịch vụ', 'success')
    } catch (error) {
      console.error(error)
      toast(error instanceof Error ? error.message : 'Không thể lưu gói dịch vụ', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deletePackage() {
    if (!detail?.id) {
      toast('Chưa chọn gói dịch vụ để xóa', 'warning')
      return
    }

    const ok = await confirm(`Xóa gói dịch vụ ${detail.name}?`)
    if (!ok) return

    try {
      setDeleting(true)

      const res = await fetch(`/api/service-packages/${detail.id}`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Không thể xóa gói dịch vụ')
      }

      setSelectedId(null)
      setDetail(null)
      setIsFormOpen(false)
      setForm(createEmptyForm())
      setEditingId(null)
      await reloadListAndDetail(null)
      toast('Đã xóa gói dịch vụ', 'success')
    } catch (error) {
      console.error(error)
      toast(error instanceof Error ? error.message : 'Không thể xóa gói dịch vụ', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '420px 1fr',
        gap: 20,
      }}
    >
      <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: 16,
            borderBottom: '1px solid #e5e7eb',
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          Thư viện gói dịch vụ
        </div>

        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eef2f7',
            display: 'grid',
            gap: 10,
          }}
        >
          <input
            className="input"
            placeholder="Tìm theo tên gói, nhóm dịch vụ, loại xe..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>{summaryText}</div>

            <button type="button" className="btn btn-primary" onClick={startCreate}>
              Thêm gói dịch vụ
            </button>
          </div>
        </div>

        {loadingList && <div style={{ padding: 16 }}>Đang tải danh sách gói dịch vụ...</div>}

        {!loadingList && listError && (
          <div style={{ padding: 16, color: 'crimson' }}>{listError}</div>
        )}

        {!loadingList && !listError && list.length === 0 && (
          <div style={{ padding: 16 }}>Chưa có gói dịch vụ phù hợp.</div>
        )}

        {!loadingList && !listError && list.length > 0 && (
          <div style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {list.map((item) => {
              const selected = item.id === selectedId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    borderBottom: '1px solid #eef2f7',
                    background: selected ? '#eef6ff' : '#fff',
                    padding: 14,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#163a63' }}>{item.name}</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>
                    {getCategoryLabel(item.category)} • {item.durationDays} ngày •{' '}
                    {getVehicleTypeLabel(item.vehicleType)}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        <div className="section-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
            <div>
              <div className="section-title" style={{ marginBottom: 4 }}>
                {isFormOpen
                  ? saveMode === 'create'
                    ? 'Tạo gói dịch vụ mới'
                    : 'Chỉnh sửa gói dịch vụ'
                  : 'Chi tiết gói dịch vụ'}
              </div>
              <div style={{ color: '#64748b', fontSize: 13 }}>
                {isFormOpen
                  ? 'Quản lý thông tin gói và lịch trình mẫu để tái sử dụng khi tạo booking.'
                  : 'Chọn một gói bên trái để xem hoặc bấm tạo mới để thêm gói dịch vụ.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!isFormOpen && detail && (
                <>
                  <button type="button" className="btn btn-secondary" onClick={startEdit}>
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={deletePackage}
                    disabled={deleting}
                  >
                    {deleting ? 'Đang xóa...' : 'Xóa gói'}
                  </button>
                </>
              )}

              {isFormOpen && (
                <>
                  <button type="button" className="btn btn-secondary" onClick={cancelForm}>
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={savePackage}
                    disabled={saving}
                  >
                    {saving ? 'Đang lưu...' : saveMode === 'create' ? 'Tạo gói' : 'Lưu cập nhật'}
                  </button>
                </>
              )}
            </div>
          </div>

          {!isFormOpen && !selectedId && (
            <div className="empty-box">Chọn một gói dịch vụ để xem chi tiết hoặc bấm Thêm gói dịch vụ.</div>
          )}

          {!isFormOpen && selectedId && loadingDetail && <div>Đang tải chi tiết gói dịch vụ...</div>}

          {!isFormOpen && selectedId && !loadingDetail && detail && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div className="grid-2">
                <div className="field">
                  <label className="label">Tên gói dịch vụ</label>
                  <div className="input" style={{ background: '#f8fafc' }}>{detail.name}</div>
                </div>
                <div className="field">
                  <label className="label">Nhóm dịch vụ</label>
                  <div className="input" style={{ background: '#f8fafc' }}>{getCategoryLabel(detail.category)}</div>
                </div>
                <div className="field">
                  <label className="label">Số ngày</label>
                  <div className="input" style={{ background: '#f8fafc' }}>{detail.durationDays}</div>
                </div>
                <div className="field">
                  <label className="label">Loại xe gợi ý</label>
                  <div className="input" style={{ background: '#f8fafc' }}>{getVehicleTypeLabel(detail.vehicleType)}</div>
                </div>
                <div className="field">
                  <label className="label">Trạng thái</label>
                  <div className="input" style={{ background: '#f8fafc' }}>
                    {detail.isActive ? 'Đang hoạt động' : 'Ngưng sử dụng'}
                  </div>
                </div>
                <div className="field">
                  <label className="label">Nguồn tham chiếu</label>
                  <div className="input" style={{ background: '#f8fafc' }}>{detail.sourceUrl || '-'}</div>
                </div>
              </div>

              <div className="field">
                <label className="label">Ghi chú nguồn</label>
                <div className="textarea" style={{ background: '#f8fafc', minHeight: 96 }}>
                  {detail.sourceNote || '-'}
                </div>
              </div>

              <div>
                <div className="section-title" style={{ marginBottom: 10 }}>Lịch trình mẫu</div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Day</th>
                        <th>Giờ đón</th>
                        <th>Giờ trả</th>
                        <th>Lịch trình</th>
                        <th>Km</th>
                        <th>Ghi chú</th>
                        <th>Phát sinh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.legs.map((leg) => (
                        <tr key={leg.id || `${detail.id}-${leg.seqNo}`}>
                          <td>{leg.seqNo}</td>
                          <td>{leg.dayNo}</td>
                          <td>{leg.pickupTime || '-'}</td>
                          <td>{leg.dropoffTime || '-'}</td>
                          <td>{leg.itinerary}</td>
                          <td>{leg.distanceKm}</td>
                          <td>{leg.note || '-'}</td>
                          <td>{leg.extraAmount.toLocaleString('vi-VN')} đ</td>
                        </tr>
                      ))}
                      {detail.legs.length === 0 && (
                        <tr>
                          <td colSpan={8}>Chưa có lịch trình mẫu.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {isFormOpen && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div className="grid-2">
                <div className="field">
                  <label className="label">Tên gói dịch vụ</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    placeholder="VD: Hà Nội - Ninh Bình 3N2D"
                  />
                </div>
                <div className="field">
                  <label className="label">Nhóm dịch vụ</label>
                  <select
                    className="select"
                    value={form.category}
                    onChange={(e) => updateForm('category', e.target.value)}
                  >
                    {CATEGORY_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Số ngày</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={form.durationDays || ''}
                    onChange={(e) => updateForm('durationDays', Number(e.target.value || 0))}
                  />
                </div>
                <div className="field">
                  <label className="label">Loại xe gợi ý</label>
                  <select
                    className="select"
                    value={form.vehicleType}
                    onChange={(e) => updateForm('vehicleType', e.target.value)}
                  >
                    <option value="4">4 chỗ</option>
                    <option value="5">5 chỗ</option>
                    <option value="7">7 chỗ</option>
                    <option value="9">9 chỗ</option>
                    <option value="16">16 chỗ</option>
                    <option value="29">29 chỗ</option>
                    <option value="35">35 chỗ</option>
                    <option value="45">45 chỗ</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Trạng thái</label>
                  <select
                    className="select"
                    value={form.isActive ? 'true' : 'false'}
                    onChange={(e) => updateForm('isActive', e.target.value === 'true')}
                  >
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Ngưng sử dụng</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Nguồn tham chiếu</label>
                  <input
                    className="input"
                    value={form.sourceUrl}
                    onChange={(e) => updateForm('sourceUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">Ghi chú nguồn</label>
                <textarea
                  className="textarea"
                  value={form.sourceNote}
                  onChange={(e) => updateForm('sourceNote', e.target.value)}
                  placeholder="Mô tả ngắn về gói dịch vụ và nguồn tham chiếu"
                />
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                    marginBottom: 10,
                  }}
                >
                  <div className="section-title" style={{ marginBottom: 0 }}>Lịch trình mẫu</div>
                  <button type="button" className="btn btn-secondary" onClick={addLeg}>
                    + Thêm chặng
                  </button>
                </div>

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Day</th>
                        <th>Giờ đón</th>
                        <th>Giờ trả</th>
                        <th>Lịch trình</th>
                        <th>Km</th>
                        <th>Ghi chú</th>
                        <th>Phát sinh</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.legs.map((leg, index) => (
                        <tr key={leg.id || `form-leg-${index}`}>
                          <td>{index + 1}</td>
                          <td>
                            <input
                              className="input"
                              type="number"
                              min={1}
                              value={leg.dayNo || ''}
                              onChange={(e) => updateLeg(index, 'dayNo', Number(e.target.value || 0))}
                            />
                          </td>
                          <td>
                            <input
                              className="input"
                              value={leg.pickupTime}
                              onChange={(e) => updateLeg(index, 'pickupTime', e.target.value)}
                              placeholder="07:00"
                            />
                          </td>
                          <td>
                            <input
                              className="input"
                              value={leg.dropoffTime}
                              onChange={(e) => updateLeg(index, 'dropoffTime', e.target.value)}
                              placeholder="17:00"
                            />
                          </td>
                          <td>
                            <input
                              className="input"
                              value={leg.itinerary}
                              onChange={(e) => updateLeg(index, 'itinerary', e.target.value)}
                              placeholder="Hà Nội → Ninh Bình"
                            />
                          </td>
                          <td>
                            <input
                              className="input"
                              type="number"
                              min={0}
                              value={leg.distanceKm || ''}
                              onChange={(e) => updateLeg(index, 'distanceKm', Number(e.target.value || 0))}
                            />
                          </td>
                          <td>
                            <input
                              className="input"
                              value={leg.note}
                              onChange={(e) => updateLeg(index, 'note', e.target.value)}
                              placeholder="Ghi chú"
                            />
                          </td>
                          <td>
                            <input
                              className="input"
                              type="number"
                              min={0}
                              value={leg.extraAmount || ''}
                              onChange={(e) => updateLeg(index, 'extraAmount', Number(e.target.value || 0))}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => removeLeg(index)}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
