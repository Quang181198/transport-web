'use client'

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export type ToastItem = {
  id: number
  message: string
  type: ToastType
}

type ConfirmState = {
  message: string
  resolve: (value: boolean) => void
} | null

type DialogContextValue = {
  toasts: ToastItem[]
  confirmState: ConfirmState
  toast: (message: string, type?: ToastType) => void
  confirm: (message: string) => Promise<boolean>
  dismissToast: (id: number) => void
  resolveConfirm: (value: boolean) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

let idCounter = 0

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)

  // Keep a ref so callbacks don't stale-close
  const confirmResolveRef = useRef<((v: boolean) => void) | null>(null)

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => dismissToast(id), 4000)
    },
    [dismissToast],
  )

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve
      setConfirmState({ message, resolve })
    })
  }, [])

  const resolveConfirm = useCallback((value: boolean) => {
    confirmResolveRef.current?.(value)
    confirmResolveRef.current = null
    setConfirmState(null)
  }, [])

  return (
    <DialogContext.Provider
      value={{ toasts, confirmState, toast, confirm, dismissToast, resolveConfirm }}
    >
      {children}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) {
    throw new Error('useDialog must be used inside <DialogProvider>')
  }
  return ctx
}
