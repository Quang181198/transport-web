'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PartnerCompanyRecord } from '@/lib/types/transport'
import { useDialog } from '@/lib/dialog-context'

type PartnerCompanyFormState = {
  companyName: string
  contactName: string
  phone: string
  email: string
  address: string
  taxCode: string
  notes: string
  isActive: boolean
}

function emptyPartnerCompanyForm(): PartnerCompanyFormState {
  return {
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    taxCode: '',
    notes: '',
    isActive: true,
  }
}

export default function AccountingPartnerCompaniesTab() {
  const { toast, confirm } = useDialog()
  const [partnerCompanies, setPartnerCompanies] = useState<PartnerCompanyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null)
  const [form, setForm] = useState<PartnerCompanyFormState>(emptyPartnerCompanyForm())
  const [submitting, setSubmitting] = useState(false)

  const filteredPartnerCompanies = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    if (!keyword) return partnerCompanies

    return partnerCompanies.filter((item) => {
      const haystack = [
        item.company_name,
        item.contact_name || '',
        item.phone || '',
        item.email || '',
        item.tax_code || '',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(keyword)
    })
  }, [partnerCompanies, searchKeyword])

  async function loadPartnerCompanies() {
    try {
      setLoading(true)
      setErrorText('')

      const res = await fetch('/api/partner-companies', {
        cache: 'no-store',
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Không thể tải danh sách công ty đối tác')
      }

      setPartnerCompanies(Array.isArray(json?.data) ? json.data : [])
    } catch (error) {
      console.error(error)
      setPartnerCompanies([])
      setErrorText(
        error instanceof Error
          ? error.message
          : 'Không thể tải danh sách công ty đối tác',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPartnerCompanies()
  }, [])

  function resetForm() {
    setEditingPartnerId(null)
    setForm(emptyPartnerCompanyForm())
  }

  function startEdit(company: PartnerCompanyRecord) {
    setEditingPartnerId(company.id)
    setForm({
      companyName: company.company_name || '',
      contactName: company.contact_name || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || '',
      taxCode: company.tax_code || '',
      notes: company.notes || '',
      isActive: company.is_active,
    })
  }

  async function submitForm() {
    if (!form.companyName.trim()) {
      toast('Vui lòng nhập tên công ty đối tác', 'warning')
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        companyName: form.companyName,
        contactName: form.contactName,
        phone: form.phone,
        email: form.email,
        address: form.address,
        taxCode: form.taxCode,
        notes: form.notes,
        isActive: form.isActive,
      }

      const res = await fetch(
        editingPartnerId
          ? `/api/partner-companies/${editingPartnerId}`
          : '/api/partner-companies',
        {
          method: editingPartnerId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      )

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Không thể lưu công ty đối tác')
      }

      await loadPartnerCompanies()
      resetForm()
      toast(editingPartnerId ? 'Đã cập nhật công ty đối tác' : 'Đã tạo công ty đối tác', 'success')
    } catch (error) {
      console.error(error)
      toast(
        error instanceof Error
          ? error.message
          : 'Không thể lưu công ty đối tác',
        'error',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteCompany(company: PartnerCompanyRecord) {
    const ok = await confirm(`Xóa công ty đối tác ${company.company_name}?`)
    if (!ok) return

    try {
      const res = await fetch(`/api/partner-companies/${company.id}`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Không thể xóa công ty đối tác')
      }

      if (editingPartnerId === company.id) {
        resetForm()
      }

      await loadPartnerCompanies()
      toast('Đã xóa công ty đối tác', 'success')
    } catch (error) {
      console.error(error)
      toast(
        error instanceof Error
          ? error.message
          : 'Không thể xóa công ty đối tác',
        'error',
      )
    }
  }

  async function toggleStatus(company: PartnerCompanyRecord) {
    try {
      const res = await fetch(`/api/partner-companies/${company.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: company.company_name,
          contactName: company.contact_name || '',
          phone: company.phone || '',
          email: company.email || '',
          address: company.address || '',
          taxCode: company.tax_code || '',
          notes: company.notes || '',
          isActive: !company.is_active,
        }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Không thể cập nhật trạng thái công ty đối tác')
      }

      await loadPartnerCompanies()

      if (editingPartnerId === company.id) {
        setForm((prev) => ({
          ...prev,
          isActive: !company.is_active,
        }))
      }
    } catch (error) {
      console.error(error)
      toast(
        error instanceof Error
          ? error.message
          : 'Không thể cập nhật trạng thái công ty đối tác',
        'error',
      )
    }
  }

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
            Danh mục công ty đối tác
          </h3>
          <div style={{ color: '#64748b', fontSize: 14 }}>
            Quản lý danh sách công ty đối tác để dùng cho dropdown ở module tạo booking.
          </div>
        </div>

        <div style={{ color: '#64748b', fontSize: 14 }}>
          Tổng công ty: <strong>{loading ? '...' : filteredPartnerCompanies.length}</strong>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 420px) 1fr',
          gap: 20,
        }}
      >
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 16,
            background: '#f8fafc',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            {editingPartnerId ? 'Chỉnh sửa công ty đối tác' : 'Thêm công ty đối tác'}
          </div>

          <div className="field">
            <label className="label">Tên công ty đối tác</label>
            <input
              className="input"
              value={form.companyName}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  companyName: e.target.value,
                }))
              }
            />
          </div>

          <div className="field">
            <label className="label">Người liên hệ</label>
            <input
              className="input"
              value={form.contactName}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  contactName: e.target.value,
                }))
              }
            />
          </div>

          <div className="field">
            <label className="label">Số điện thoại</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
            />
          </div>

          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
            />
          </div>

          <div className="field">
            <label className="label">Địa chỉ</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
            />
          </div>

          <div className="field">
            <label className="label">Mã số thuế</label>
            <input
              className="input"
              value={form.taxCode}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  taxCode: e.target.value,
                }))
              }
            />
          </div>

          <div className="field">
            <label className="label">Ghi chú</label>
            <textarea
              className="textarea"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
            />
          </div>

          <div className="field">
            <label className="label">Trạng thái</label>
            <select
              className="select"
              value={form.isActive ? 'active' : 'inactive'}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  isActive: e.target.value === 'active',
                }))
              }
            >
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginTop: 16,
            }}
          >
            <button
              type="button"
              className="btn btn-primary"
              onClick={submitForm}
              disabled={submitting}
            >
              {submitting
                ? 'Đang lưu...'
                : editingPartnerId
                  ? 'Lưu cập nhật'
                  : 'Thêm công ty đối tác'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
              disabled={submitting}
            >
              {editingPartnerId ? 'Hủy chỉnh sửa' : 'Làm mới form'}
            </button>
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 16 }}>
            <input
              className="input"
              placeholder="Search công ty, liên hệ, phone, email..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>

          {loading && <div>Đang tải danh sách công ty đối tác...</div>}

          {!loading && errorText && (
            <div style={{ color: 'crimson' }}>{errorText}</div>
          )}

          {!loading && !errorText && filteredPartnerCompanies.length === 0 && (
            <div className="empty-box">
              {searchKeyword.trim()
                ? 'Không tìm thấy công ty đối tác phù hợp.'
                : 'Chưa có công ty đối tác nào.'}
            </div>
          )}

          {!loading && !errorText && filteredPartnerCompanies.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Tên công ty</th>
                    <th>Liên hệ</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>MST</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartnerCompanies.map((company) => (
                    <tr key={company.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{company.company_name}</div>
                        {company.address ? (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                            {company.address}
                          </div>
                        ) : null}
                      </td>
                      <td>{company.contact_name || '-'}</td>
                      <td>{company.phone || '-'}</td>
                      <td>{company.email || '-'}</td>
                      <td>{company.tax_code || '-'}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            color: company.is_active ? '#15803d' : '#b91c1c',
                            background: company.is_active ? '#dcfce7' : '#fee2e2',
                            border: `1px solid ${company.is_active ? '#86efac' : '#fca5a5'}`,
                          }}
                        >
                          {company.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => startEdit(company)}
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => toggleStatus(company)}
                          >
                            {company.is_active ? 'Khóa' : 'Mở'}
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => deleteCompany(company)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}