'use client'

import { useEffect, useState } from 'react'

type Settings = {
  company_name: string
  company_short_name: string
  company_address: string
  company_phone: string
  company_hotline: string
  company_email: string
  company_email_alt: string
  company_website: string
  company_tax_code: string
  company_logo_url: string
  company_signature_url: string
  app_name: string
  app_description: string
}

const DEFAULT_SETTINGS: Settings = {
  company_name: '',
  company_short_name: '',
  company_address: '',
  company_phone: '',
  company_hotline: '',
  company_email: '',
  company_email_alt: '',
  company_website: '',
  company_tax_code: '',
  company_logo_url: '',
  company_signature_url: '',
  app_name: '',
  app_description: '',
}

function Field({
  id,
  label,
  value,
  hint,
  onChange,
  type = 'text',
}: {
  id: string
  label: string
  value: string
  hint?: string
  onChange: (v: string) => void
  type?: 'text' | 'email' | 'url' | 'textarea'
}) {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={id}
          className="textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          type={type}
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint && (
        <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: -2 }}>
          {hint}
        </span>
      )}
    </div>
  )
}

function ImagePreview({ url, label }: { url: string; label: string }) {
  if (!url) return null
  return (
    <div
      style={{
        marginTop: 8,
        padding: 10,
        background: 'var(--surface-soft)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <img
        src={url}
        alt={label}
        style={{
          height: 48,
          maxWidth: 160,
          objectFit: 'contain',
          borderRadius: 6,
          background: 'white',
          padding: 4,
          border: '1px solid var(--border)',
        }}
        onError={(e) => {
          ;(e.target as HTMLImageElement).style.display = 'none'
        }}
      />
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
        Preview {label}
      </span>
    </div>
  )
}

export default function CompanySettingsForm() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadSettings() {
      try {
        const res = await fetch('/api/settings')
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Không tải được cài đặt')

        if (mounted) {
          setSettings((prev) => ({
            ...prev,
            ...(json.settings as Partial<Settings>),
          }))
        }
      } catch (err) {
        if (mounted) {
          setErrorMsg(
            err instanceof Error ? err.message : 'Không tải được cài đặt',
          )
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadSettings()
    return () => {
      mounted = false
    }
  }, [])

  function set(key: keyof Settings) {
    return (value: string) => setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    try {
      setSaving(true)
      setSuccessMsg('')
      setErrorMsg('')

      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Lưu thất bại')

      setSuccessMsg(
        'Đã lưu cài đặt thành công. PDF và giao diện sẽ dùng thông tin mới ngay lập tức.',
      )
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="section-card" style={{ color: 'var(--muted)' }}>
        Đang tải cài đặt...
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* ── App Settings ───────────────────────────────────── */}
      <div className="section-card">
        <h3 className="section-title">⚙️ Cài đặt ứng dụng</h3>
        <div className="grid-2">
          <Field
            id="app_name"
            label="Tên ứng dụng (hiển thị trên tab trình duyệt)"
            value={settings.app_name}
            onChange={set('app_name')}
            hint="Ví dụ: Transport Management — XYZ Company"
          />
          <Field
            id="app_description"
            label="Mô tả ứng dụng"
            value={settings.app_description}
            onChange={set('app_description')}
            hint="Hiển thị ở topbar khi không có subtitle"
          />
        </div>
      </div>

      {/* ── Company Info ───────────────────────────────────── */}
      <div className="section-card">
        <h3 className="section-title">🏢 Thông tin công ty</h3>
        <p
          style={{
            margin: '0 0 18px',
            color: 'var(--muted)',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Thông tin này được dùng trong PDF báo giá, lệnh điều xe và giao diện
          sidebar. Nếu để trống, hệ thống sẽ dùng giá trị từ biến môi trường
          (env vars).
        </p>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="grid-2">
            <Field
              id="company_name"
              label="Tên pháp lý đầy đủ"
              value={settings.company_name}
              onChange={set('company_name')}
              hint="Dùng trong PDF — ví dụ: CÔNG TY TNHH VẬN TẢI XYZ"
            />
            <Field
              id="company_short_name"
              label="Tên ngắn (hiển thị sidebar)"
              value={settings.company_short_name}
              onChange={set('company_short_name')}
              hint="Ví dụ: XYZ Transport"
            />
          </div>

          <Field
            id="company_address"
            label="Địa chỉ"
            value={settings.company_address}
            onChange={set('company_address')}
            type="textarea"
          />

          <div className="grid-2">
            <Field
              id="company_phone"
              label="Số điện thoại văn phòng"
              value={settings.company_phone}
              onChange={set('company_phone')}
            />
            <Field
              id="company_hotline"
              label="Hotline / số di động"
              value={settings.company_hotline}
              onChange={set('company_hotline')}
            />
          </div>

          <div className="grid-2">
            <Field
              id="company_email"
              label="Email chính"
              value={settings.company_email}
              onChange={set('company_email')}
              type="email"
            />
            <Field
              id="company_email_alt"
              label="Email phụ (Sales)"
              value={settings.company_email_alt}
              onChange={set('company_email_alt')}
              type="email"
            />
          </div>

          <div className="grid-2">
            <Field
              id="company_website"
              label="Website"
              value={settings.company_website}
              onChange={set('company_website')}
              hint="Ví dụ: www.xyztransport.vn"
            />
            <Field
              id="company_tax_code"
              label="Mã số thuế"
              value={settings.company_tax_code}
              onChange={set('company_tax_code')}
            />
          </div>
        </div>
      </div>

      {/* ── Branding / Images ──────────────────────────────── */}
      <div className="section-card">
        <h3 className="section-title">🖼️ Hình ảnh thương hiệu</h3>
        <p
          style={{
            margin: '0 0 18px',
            color: 'var(--muted)',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Nhập URL công khai của hình ảnh. Upload ảnh lên Supabase Storage hoặc
          CDN bất kỳ, rồi dán URL vào đây.
        </p>

        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <Field
              id="company_logo_url"
              label="URL logo công ty"
              value={settings.company_logo_url}
              onChange={set('company_logo_url')}
              type="url"
              hint="PNG hoặc SVG. Để trống để dùng file /public/logo-company.png"
            />
            <ImagePreview url={settings.company_logo_url} label="logo" />
          </div>

          <div>
            <Field
              id="company_signature_url"
              label="URL chữ ký / con dấu"
              value={settings.company_signature_url}
              onChange={set('company_signature_url')}
              type="url"
              hint="Dùng trong PDF. Để trống để dùng file /public/signature-company.png"
            />
            <ImagePreview
              url={settings.company_signature_url}
              label="chữ ký"
            />
          </div>
        </div>
      </div>

      {/* ── Feedback & Save ────────────────────────────────── */}
      {successMsg && (
        <div
          style={{
            padding: '14px 18px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 12,
            color: '#15803d',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          ✅ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '14px 18px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            color: '#b91c1c',
            fontSize: 14,
          }}
        >
          ❌ {errorMsg}
        </div>
      )}

      <div className="actions" style={{ justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ minWidth: 160, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Đang lưu...' : '💾 Lưu cài đặt'}
        </button>
      </div>
    </div>
  )
}
