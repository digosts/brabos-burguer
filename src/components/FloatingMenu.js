'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconHome, IconReceipt, IconUser } from './Icons'

const ITEMS = [
  { href: '/inicio', label: 'Início', Icon: IconHome },
  { href: '/pedidos', label: 'Pedidos', Icon: IconReceipt },
  { href: '/perfil', label: 'Perfil', Icon: IconUser },
]

export default function FloatingMenu({ ordersBadge = 0 }) {
  const pathname = usePathname()

  return (
    <nav className="fab-nav" aria-label="Menu principal">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            className={`fab-nav-item${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={21} />
            {label}
            {href === '/pedidos' && ordersBadge > 0 ? (
              <span className="badge" aria-label={`${ordersBadge} em andamento`}>
                {ordersBadge}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
