'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/context/CartContext'
import { brl } from '@/lib/format'
import { IconCart } from './Icons'

/** Botão flutuante do carrinho — aparece assim que há um item. */
export default function CartFab() {
  const { count, subtotal, setOpen, bump } = useCart()
  const [pulse, setPulse] = useState(false)

  // Pequeno "pulo" a cada item adicionado, para o usuário perceber
  // que o carrinho foi atualizado.
  useEffect(() => {
    if (!bump) return
    setPulse(true)
    const t = setTimeout(() => setPulse(false), 460)
    return () => clearTimeout(t)
  }, [bump])

  if (count === 0) return null

  return (
    <button
      className={`cart-fab${pulse ? ' bump' : ''}`}
      onClick={() => setOpen(true)}
      aria-label={`Abrir carrinho: ${count} ${count === 1 ? 'item' : 'itens'}, ${brl(subtotal)}`}
    >
      <IconCart size={21} />
      <span className="cart-count">{count}</span>
      <span>{brl(subtotal)}</span>
    </button>
  )
}
