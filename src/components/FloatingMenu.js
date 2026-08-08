'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { IconCart, IconHome, IconReceipt, IconTruck, IconUser } from './Icons'

const ITEMS = [
  { href: '/inicio', label: 'Início', Icon: IconHome },
  { href: '/pedidos', label: 'Pedidos', Icon: IconReceipt },
  { href: '/perfil', label: 'Perfil', Icon: IconUser },
]

const ADMIN_ITEM = { href: '/admin/pedidos', label: 'Gestão', Icon: IconTruck, admin: true }

/**
 * `items` só é passado pela área pública, que tem outro conjunto de telas.
 * Sem ele vale o menu de quem está logado.
 */
export default function FloatingMenu({ items, ordersBadge = 0, isAdmin = false, adminBadge = 0 }) {
  const pathname = usePathname()
  const { count, isOpen, setOpen } = useCart()

  // Esconder o item é só conforto visual: quem não é admin também não passa
  // pelo layout de /admin nem pelas rotas de API, que verificam no servidor.
  const list = items || (isAdmin ? [...ITEMS, ADMIN_ITEM] : ITEMS)

  // O carrinho aparece aqui além do botão da barra do topo: quem está
  // escolhendo produtos tem o polegar embaixo, e subir a mão até o topo da
  // tela para conferir o pedido é o movimento mais chato do fluxo.
  //
  // Fora do menu do admin de propósito: ali o quarto botão é a "Gestão", e
  // quem está despachando pedido não está comprando.
  const showCart = !isAdmin

  return (
    <nav className="fab-nav" aria-label="Menu principal">
      {list.map(({ href, label, Icon, admin }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        // "Gestão" fica destacado em qualquer tela da área administrativa.
        const highlighted = admin ? pathname.startsWith('/admin') : active
        const badge = admin ? adminBadge : href === '/pedidos' ? ordersBadge : 0

        return (
          <Link
            key={href}
            href={href}
            className={`fab-nav-item${highlighted ? ' active' : ''}`}
            aria-current={highlighted ? 'page' : undefined}
          >
            <Icon size={21} />
            {label}
            {badge > 0 ? (
              <span className="badge" aria-label={`${badge} em andamento`}>
                {badge}
              </span>
            ) : null}
          </Link>
        )
      })}

      {showCart ? (
        <button
          className={`fab-nav-item${isOpen ? ' active' : ''}`}
          onClick={() => setOpen(true)}
          aria-label={`Abrir carrinho${count > 0 ? `: ${count} itens` : ' (vazio)'}`}
        >
          <IconCart size={21} />
          Carrinho
          {count > 0 ? <span className="badge badge-cart">{count}</span> : null}
        </button>
      ) : null}
    </nav>
  )
}
