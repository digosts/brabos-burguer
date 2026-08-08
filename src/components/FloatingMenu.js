'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconHome, IconReceipt, IconTruck, IconUser } from './Icons'

const ITEMS = [
  { href: '/inicio', label: 'Início', Icon: IconHome },
  { href: '/pedidos', label: 'Pedidos', Icon: IconReceipt },
  { href: '/perfil', label: 'Perfil', Icon: IconUser },
]

const ADMIN_ITEM = { href: '/admin/pedidos', label: 'Gestão', Icon: IconTruck, admin: true }

export default function FloatingMenu({ ordersBadge = 0, isAdmin = false, adminBadge = 0 }) {
  const pathname = usePathname()

  // Esconder o item é só conforto visual: quem não é admin também não passa
  // pelo layout de /admin nem pelas rotas de API, que verificam no servidor.
  const items = isAdmin ? [...ITEMS, ADMIN_ITEM] : ITEMS

  return (
    <nav className="fab-nav" aria-label="Menu principal">
      {items.map(({ href, label, Icon, admin }) => {
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
    </nav>
  )
}
