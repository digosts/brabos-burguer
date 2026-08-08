'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/context/CartContext'
import { IconCart } from './Icons'

/**
 * O carrinho da barra do topo — o único da tela, tanto para quem está
 * logado quanto para quem entrou direto pelo cardápio.
 */
export default function CartButton() {
  const { count, setOpen, bump } = useCart()
  const [pulse, setPulse] = useState(false)

  // Pequeno "pulo" a cada item adicionado: o botão fica no topo, longe do
  // dedo que acabou de tocar em "Adicionar", então precisa se anunciar.
  useEffect(() => {
    if (!bump) return
    setPulse(true)
    const t = setTimeout(() => setPulse(false), 460)
    return () => clearTimeout(t)
  }, [bump])

  return (
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
  )
}
