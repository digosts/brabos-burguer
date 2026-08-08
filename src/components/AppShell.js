'use client'

import { useEffect, useState } from 'react'
import { SHOP } from '@/lib/shop'
import { useCart } from '@/context/CartContext'
import FloatingMenu from './FloatingMenu'
import CartSheet from './CartSheet'
import { IconCart } from './Icons'

export default function AppShell({ ordersBadge = 0, isAdmin = false, adminBadge = 0, children }) {
  const { count, setOpen, bump } = useCart()
  const [pulse, setPulse] = useState(false)

  // Pequeno "pulo" a cada item adicionado, para o usuário perceber que o
  // carrinho foi atualizado mesmo com o botão lá em cima.
  useEffect(() => {
    if (!bump) return
    setPulse(true)
    const t = setTimeout(() => setPulse(false), 460)
    return () => clearTimeout(t)
  }, [bump])

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="topbar-brand">
            <img src="/icons/icon-192.png" alt="" width={38} height={38} />
            <div style={{ minWidth: 0 }}>
              <strong>{SHOP.name}</strong>
              <span>Entrega em 30–45 min</span>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              className={`icon-btn${pulse ? ' bump' : ''}`}
              onClick={() => setOpen(true)}
              aria-label={`Abrir carrinho${count > 0 ? `: ${count} itens` : ' (vazio)'}`}
              style={{ position: 'relative' }}
            >
              <IconCart size={20} />
              {count > 0 ? (
                <span
                  className="badge"
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    minWidth: 19,
                    height: 19,
                    lineHeight: '19px',
                    borderRadius: 999,
                    background: 'var(--brand)',
                    color: '#fff',
                    fontSize: 10.5,
                    fontWeight: 700,
                    textAlign: 'center',
                    border: '2px solid var(--bg)',
                  }}
                >
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>

      <main className="container page">{children}</main>

      <FloatingMenu ordersBadge={ordersBadge} isAdmin={isAdmin} adminBadge={adminBadge} />
      <CartSheet />
    </div>
  )
}
