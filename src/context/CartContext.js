'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

const STORAGE_KEY = 'burger.cart.v1'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isOpen, setOpen] = useState(false)
  // Contador incrementado a cada item adicionado: dispara a animação do botão.
  const [bump, setBump] = useState(0)
  const hydrated = useRef(false)

  // Recupera o carrinho salvo (o cliente pode fechar o app e voltar depois).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch {
      // localStorage bloqueado (modo privado) — segue com carrinho vazio.
    }
    hydrated.current = true
  }, [])

  useEffect(() => {
    // Só grava depois de hidratar, senão o array vazio inicial apagaria o salvo.
    if (!hydrated.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* sem espaço ou bloqueado: ignorar */
    }
  }, [items])

  const api = useMemo(() => {
    const add = (product, qty = 1) => {
      setItems((prev) => {
        const i = prev.findIndex((it) => it.productId === product.id)
        if (i >= 0) {
          const next = [...prev]
          next[i] = { ...next[i], qty: Math.min(99, next[i].qty + qty) }
          return next
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.image || '',
            qty,
            notes: '',
          },
        ]
      })
      setBump((n) => n + 1)
    }

    const setQty = (productId, qty) => {
      setItems((prev) =>
        qty <= 0
          ? prev.filter((it) => it.productId !== productId)
          : prev.map((it) => (it.productId === productId ? { ...it, qty: Math.min(99, qty) } : it))
      )
    }

    const setNotes = (productId, notes) =>
      setItems((prev) =>
        prev.map((it) => (it.productId === productId ? { ...it, notes: notes.slice(0, 200) } : it))
      )

    const remove = (productId) => setItems((prev) => prev.filter((it) => it.productId !== productId))

    return { add, setQty, setNotes, remove, clear: () => setItems([]) }
  }, [])

  const count = items.reduce((n, it) => n + it.qty, 0)
  const subtotal = items.reduce((n, it) => n + it.price * it.qty, 0)
  const qtyOf = (productId) => items.find((it) => it.productId === productId)?.qty || 0

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, qtyOf, isOpen, setOpen, bump, ...api }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart precisa estar dentro de <CartProvider>')
  return ctx
}
