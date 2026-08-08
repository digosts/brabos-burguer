'use client'

import { SHOP } from '@/lib/shop'
import FloatingMenu from './FloatingMenu'
import CartButton from './CartButton'
import CartSheet from './CartSheet'

export default function AppShell({ ordersBadge = 0, isAdmin = false, adminBadge = 0, children }) {
  // Quem opera a loja não compra nela: sem carrinho no topo e sem a gaveta
  // do carrinho. O menu flutuante já seguia essa regra, mas o botão do topo
  // tinha ficado para trás — e botão que não serve para nada só rende toque
  // errado no meio do serviço.
  const showCart = !isAdmin

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

          {showCart ? (
            <div className="topbar-actions">
              <CartButton />
            </div>
          ) : null}
        </div>
      </header>

      <main className="container page">{children}</main>

      <FloatingMenu ordersBadge={ordersBadge} isAdmin={isAdmin} adminBadge={adminBadge} />
      {showCart ? <CartSheet /> : null}
    </div>
  )
}
