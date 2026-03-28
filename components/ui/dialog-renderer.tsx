'use client'

import { useDialog } from '@/lib/dialog-context'

const TOAST_COLORS: Record<
  string,
  { background: string; border: string; color: string; icon: string }
> = {
  success: {
    background: '#f0fdf4',
    border: '#86efac',
    color: '#166534',
    icon: '✅',
  },
  error: {
    background: '#fef2f2',
    border: '#fca5a5',
    color: '#991b1b',
    icon: '❌',
  },
  warning: {
    background: '#fffbeb',
    border: '#fcd34d',
    color: '#92400e',
    icon: '⚠️',
  },
  info: {
    background: '#eff6ff',
    border: '#93c5fd',
    color: '#1e40af',
    icon: 'ℹ️',
  },
}

export default function DialogRenderer() {
  const { toasts, confirmState, dismissToast, resolveConfirm } = useDialog()

  return (
    <>
      {/* ── Toast stack ── */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          display: 'grid',
          gap: 10,
          width: 360,
          maxWidth: 'calc(100vw - 40px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const colors = TOAST_COLORS[t.type] ?? TOAST_COLORS.info
          return (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 12,
                background: colors.background,
                border: `1px solid ${colors.border}`,
                color: colors.color,
                fontSize: 14,
                lineHeight: 1.55,
                fontWeight: 500,
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                pointerEvents: 'all',
                animation: 'toastIn 0.25s ease',
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                {colors.icon}
              </span>
              <span style={{ flex: 1 }}>{t.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.color,
                  opacity: 0.6,
                  fontSize: 16,
                  lineHeight: 1,
                  padding: '0 2px',
                  flexShrink: 0,
                  marginTop: 1,
                }}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Confirm dialog ── */}
      {confirmState && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) resolveConfirm(false)
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 18,
              padding: 28,
              width: 420,
              maxWidth: 'calc(100vw - 32px)',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
              display: 'grid',
              gap: 22,
            }}
          >
            <div
              style={{
                fontSize: 15,
                lineHeight: 1.65,
                color: '#1e293b',
                fontWeight: 500,
              }}
            >
              {confirmState.message}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => resolveConfirm(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => resolveConfirm(true)}
                style={{ background: '#0f172a', color: '#fff' }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)  scale(1);    }
        }
      `}</style>
    </>
  )
}
