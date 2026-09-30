'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { EXTRAS, MAX_EXTRA_QTY, extrasTotal } from '@/lib/extras'

/**
 * v2: cada linha tem `lineId` e `extras`. O carrinho salvo no formato antigo
 * é descartado — ele apontava para produtos que saíram do menu.
 */
const STORAGE_KEY = 'burger.cart.v2'

const CartContext = createContext(null)

const newLineId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

/** Preço de uma unidade da linha, já com os adicionais. */
const unitPrice = (basePrice, extras) => basePrice + extrasTotal(extras)

/**
 * O carrinho salvo guarda o preço do adicional da época em que foi montado.
 * Ao carregar, os adicionais são reconferidos contra `EXTRAS`: preço novo
 * entra, adicional que saiu da lista cai — a tela mostra o mesmo valor que
 * o servidor vai cobrar.
 */
function repriceExtras(item) {
  const extras = (item.extras || [])
    .map((e) => {
      const current = EXTRAS.find((x) => x.id === e.id)
      return current ? { ...e, name: current.label, price: current.price } : null
    })
    .filter(Boolean)
  return { ...item, extras, price: unitPrice(item.basePrice, extras) }
}

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
        if (Array.isArray(parsed)) setItems(parsed.filter((it) => it && it.lineId).map(repriceExtras))
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
    /**
     * O "+" do cardápio sempre soma na linha *sem* adicionais daquele lanche.
     * É o que permite pedir dois iguais com bacon só em um: coloca o bacon
     * na linha que já está no carrinho e toca "+" de novo no cardápio — o
     * segundo vem puro, numa linha separada.
     */
    const add = (product, qty = 1) => {
      setItems((prev) => {
        const i = prev.findIndex((it) => it.productId === product.id && !it.extras?.length)
        if (i >= 0) {
          const next = [...prev]
          next[i] = { ...next[i], qty: Math.min(99, next[i].qty + qty) }
          return next
        }
        return [
          ...prev,
          {
            lineId: newLineId(),
            productId: product.id,
            name: product.name,
            basePrice: product.price,
            price: product.price,
            image: product.image || '',
            allowExtras: Boolean(product.allowExtras),
            extras: [],
            qty,
            notes: '',
          },
        ]
      })
      setBump((n) => n + 1)
    }

    const setQty = (lineId, qty) => {
      setItems((prev) =>
        qty <= 0
          ? prev.filter((it) => it.lineId !== lineId)
          : prev.map((it) => (it.lineId === lineId ? { ...it, qty: Math.min(99, qty) } : it))
      )
    }

    /** O "−" do cardápio: tira de preferência da linha sem adicionais. */
    const decrement = (productId) => {
      setItems((prev) => {
        const lines = prev.filter((it) => it.productId === productId)
        if (lines.length === 0) return prev
        const target = [...lines].reverse().find((it) => !it.extras?.length) || lines[lines.length - 1]
        return target.qty <= 1
          ? prev.filter((it) => it.lineId !== target.lineId)
          : prev.map((it) => (it.lineId === target.lineId ? { ...it, qty: it.qty - 1 } : it))
      })
    }

    /** Define quantas vezes um adicional entra em cada unidade da linha. */
    const setExtraQty = (lineId, extraId, qty) => {
      const extra = EXTRAS.find((e) => e.id === extraId)
      if (!extra) return
      const n = Math.max(0, Math.min(MAX_EXTRA_QTY, qty))
      setItems((prev) =>
        prev.map((it) => {
          if (it.lineId !== lineId || !it.allowExtras) return it
          const others = (it.extras || []).filter((e) => e.id !== extraId)
          const withThis = n > 0 ? [...others, { id: extra.id, name: extra.label, price: extra.price, qty: n }] : others
          // Mantém a ordem de EXTRAS, para a lista não "pular" a cada toque.
          const extras = EXTRAS.map((e) => withThis.find((x) => x.id === e.id)).filter(Boolean)
          return { ...it, extras, price: unitPrice(it.basePrice, extras) }
        })
      )
    }

    const setNotes = (lineId, notes) =>
      setItems((prev) =>
        prev.map((it) => (it.lineId === lineId ? { ...it, notes: notes.slice(0, 200) } : it))
      )

    const remove = (lineId) => setItems((prev) => prev.filter((it) => it.lineId !== lineId))

    return { add, setQty, decrement, setExtraQty, setNotes, remove, clear: () => setItems([]) }
  }, [])

  const count = items.reduce((n, it) => n + it.qty, 0)
  const subtotal = items.reduce((n, it) => n + it.price * it.qty, 0)
  // Soma todas as linhas do lanche — com e sem adicionais.
  const qtyOf = (productId) =>
    items.reduce((n, it) => (it.productId === productId ? n + it.qty : n), 0)

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
