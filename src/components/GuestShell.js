'use client'

import { SHOP } from '@/lib/shop'
import FloatingMenu from './FloatingMenu'
import CartButton from './CartButton'
import CartSheet from './CartSheet'
import { IconHome, IconReceipt } from './Icons'

/**
 * Casca da loja aberta: quem chega no app cai aqui, sem login, e já pode
 * montar o pedido.
 *
 * O menu não oferece "Entrar" de propósito — para o cliente, conta é um
 * assunto que não existe. Quem precisa do login (a loja, indo para a
 * gestão) chega nele pela URL /login, que continua de pé.
 */
const GUEST_ITEMS = [
  { href: '/', label: 'Cardápio', Icon: IconHome },
  { href: '/meus-pedidos', label: 'Meus pedidos', Icon: IconReceipt },
]

export default function GuestShell({ children }) {
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
            <CartButton />
          </div>
        </div>
      </header>

      <main className="container page">{children}</main>

      <FloatingMenu items={GUEST_ITEMS} />
      <CartSheet />
    </div>
  )
}
