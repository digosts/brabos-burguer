'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { IconAlert, IconCheckCircle, IconInfo } from '@/components/Icons'

const ToastContext = createContext(null)

const ICON = {
  ok: IconCheckCircle,
  error: IconAlert,
  info: IconInfo,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const toast = useCallback((message, tone = 'ok', ms = 3200) => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, message, tone }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), ms)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICON[t.tone] || IconInfo
          return (
            <div key={t.id} className={`toast ${t.tone}`}>
              <Icon size={18} />
              <span>{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return ctx.toast
}
