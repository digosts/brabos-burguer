'use client'

import { useEffect, useRef } from 'react'
import { IconX } from './Icons'

/**
 * Bottom sheet no celular e painel lateral no desktop (só muda o CSS).
 * Fecha no Esc, no clique fora e travando o scroll do fundo.
 */
export default function Sheet({ open, onClose, title, subtitle, footer, children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Foco no painel para quem navega por teclado / leitor de tela.
    panelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="sheet-head">
          <span className="sheet-grip" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <IconX size={18} />
          </button>
        </div>

        <div className="sheet-body">{children}</div>

        {footer ? <div className="sheet-foot">{footer}</div> : null}
      </div>
    </>
  )
}
