'use client'

import { useEffect, useMemo, useState } from 'react'
import { type DatabaseProfile, type UserRole, getRoleLabel } from '@/lib/types/auth'
import { useDialog } from '@/lib/dialog-context'

type UserFormPayload = {
  mode: 'create' | 'update'
  id?: string
  email?: string
  full_name?: string
  role: UserRole
  is_active: boolean
}

export default function UsersManagementTab() {
  const { toast, confirm } = useDialog()
  const [users, setUsers] = useState<DatabaseProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState('')
  const [search, setSearch] = useState('')

  const [formConfig, setFormConfig] = useState<UserFormPayload | null>(null)
  const [saving, setSaving] = useState(false)

  const roles: UserRole[] = ['admin', 'manager', 'sales', 'operator', 'accountant']

  async function loadUsers() {
    try {
      setLoading(true)
      setErrorText('')

      const res = await fetch('/api/users', {
        cache: 'no-store',
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Cannot load users')
      }

      setUsers(Array.isArray(json?.users) ? json.users : [])
    } catch (error) {
      console.error(error)
      setErrorText(error instanceof Error ? error.message : 'Cannot load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return users

    return users.filter((item) => {
      const haystack = [
        item.email || '',
        item.full_name || '',
        getRoleLabel(item.role as UserRole) || '',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(keyword)
    })
  }, [search, users])

  function startCreate() {
    setFormConfig({
      mode: 'create',
      email: '',
      full_name: '',
      role: 'operator',
      is_active: true,
    })
  }

  function startEdit(item: DatabaseProfile) {
    setFormConfig({
      mode: 'update',
      id: item.id,
      email: item.email || '',
      full_name: item.full_name || '',
      role: item.role as UserRole,
      is_active: item.is_active,
    })
  }

  function cancelForm() {
    setFormConfig(null)
  }

  async function saveUser() {
    if (!formConfig) return

    try {
      setSaving(true)

      const res = await fetch('/api/users', {
        method: formConfig.mode === 'create' ? 'POST' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formConfig),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || 'Cannot save user')
      }

      await loadUsers()
      setFormConfig(null)
      toast(formConfig.mode === 'create' ? 'User created successfully' : 'User updated successfully', 'success')
    } catch (error) {
      console.error(error)
      toast(error instanceof Error ? error.message : 'Cannot update user', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {loading && <div className="section-card">Loading users...</div>}

      {!loading && errorText && (
        <div className="section-card" style={{ color: 'crimson' }}>
          {errorText}
        </div>
      )}

      {!loading && !errorText && (
        <div className="grid-1">
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
                User list
              </h3>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={startCreate}
              >
                Create user
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                className="input"
                placeholder="Search email, name, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
                {filteredUsers.length}/{users.length} users
              </div>
            </div>

            {formConfig && (
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
                    {formConfig.mode === 'create' ? 'Create new user' : 'Update user'}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cancelForm}
                  >
                    Đóng
                  </button>
                </div>

                <div className="grid-2">
                  {formConfig.mode === 'create' && (
                    <div className="field">
                      <label className="label">Email *</label>
                      <input
                        className="input"
                        type="email"
                        placeholder="user@hdtransport.vn"
                        value={formConfig.email}
                        onChange={(e) =>
                          setFormConfig((prev) => prev && { ...prev, email: e.target.value })
                        }
                      />
                    </div>
                  )}

                  {formConfig.mode === 'create' && (
                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                      <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 8, border: '1px solid #bbf7d0', color: '#166534', fontSize: 13 }}>
                        <strong>Lưu ý bảo mật:</strong> Tin nhắn chứa thư mời cùng đường dẫn thiết lập mật khẩu sẽ được hệ thống gửi tự động đến Email này sau khi bạn nhấp &quot;Lưu&quot;.
                      </div>
                    </div>
                  )}

                  {formConfig.mode === 'update' && (
                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                      <label className="label">Quản lý Mật Khẩu</label>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ maxWidth: 220 }}
                        onClick={async () => {
                          const ok = await confirm('Hệ thống sẽ gửi email đặt lại mật khẩu đến ' + formConfig.email + '. Tiếp tục?')
                          if (!ok) return
                          try {
                            const res = await fetch('/api/users/reset-password', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: formConfig.email }),
                            })
                            if (!res.ok) throw new Error('Cannot send reset email')
                            toast('Đã gửi email khôi phục mật khẩu thành công!', 'success')
                          } catch (e) {
                            toast('Gửi email thất bại: ' + (e as Error).message, 'error')
                          }
                        }}
                      >
                        Gửi Email Đặt Lại Mật Khẩu
                      </button>
                    </div>
                  )}

                  <div className="field">
                    <label className="label">Full Name</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={formConfig.full_name}
                      onChange={(e) =>
                        setFormConfig((prev) => prev && { ...prev, full_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="field">
                    <label className="label">Role</label>
                    <select
                      className="input"
                      value={formConfig.role}
                      onChange={(e) =>
                        setFormConfig((prev) => prev && { ...prev, role: e.target.value as UserRole })
                      }
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {getRoleLabel(r)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formConfig.is_active}
                        onChange={(e) =>
                          setFormConfig((prev) => prev && { ...prev, is_active: e.target.checked })
                        }
                      />
                      <span>Is Active</span>
                    </label>
                  </div>
                </div>

                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{ background: '#0f172a', color: '#fff' }}
                    onClick={saveUser}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            )}

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => (
                    <tr key={item.id}>
                      <td>{item.email}</td>
                      <td>{item.full_name || '-'}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            background: '#e2e8f0',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {getRoleLabel(item.role as UserRole) || item.role}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            color: item.is_active ? '#10b981' : '#f43f5e',
                            fontWeight: 500,
                          }}
                        >
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: 13 }}
                            onClick={() => startEdit(item)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {!loading && !errorText && (
        <div className="section-card" style={{ marginTop: 0 }}>
          <h3 className="section-title" style={{ marginBottom: 16 }}>
            Quyền truy cập theo Role
          </h3>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th style={{ textAlign: 'center' }}>Admin</th>
                  <th style={{ textAlign: 'center' }}>Manager</th>
                  <th style={{ textAlign: 'center' }}>Sales</th>
                  <th style={{ textAlign: 'center' }}>Operator</th>
                  <th style={{ textAlign: 'center' }}>Accountant</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { module: 'New Booking',     admin: true,  manager: true,  sales: true,  operator: true,  accountant: false },
                  { module: 'Dispatch',        admin: true,  manager: true,  sales: true,  operator: true,  accountant: false },
                  { module: 'Resources',       admin: true,  manager: true,  sales: false, operator: true,  accountant: false },
                  { module: 'Services',        admin: true,  manager: true,  sales: true,  operator: true,  accountant: false },
                  { module: 'Accounting',      admin: true,  manager: true,  sales: false, operator: false, accountant: true  },
                  { module: 'User Management', admin: true,  manager: false, sales: false, operator: false, accountant: false },
                ].map((row) => (
                  <tr key={row.module}>
                    <td style={{ fontWeight: 500 }}>{row.module}</td>
                    {(['admin', 'manager', 'sales', 'operator', 'accountant'] as const).map((role) => (
                      <td key={role} style={{ textAlign: 'center', fontSize: 18 }}>
                        {row[role] ? (
                          <span style={{ color: '#10b981' }}>✅</span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>❌</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
