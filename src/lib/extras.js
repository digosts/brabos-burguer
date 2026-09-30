/**
 * Adicionais que o cliente pode colocar num lanche, direto no carrinho.
 *
 * A lista é a mesma no navegador e na API: o carrinho usa para mostrar os
 * botões e somar o preço na tela, e a rota de pedidos usa para recalcular.
 * O valor que vale é sempre o daqui, lido no servidor — o preço que vem do
 * navegador é ignorado, igual ao do próprio lanche.
 *
 * Só aparece em produto com `allowExtras: true` no banco.
 */
export const EXTRAS = [
  { id: 'bacon', label: 'Bacon', price: 3 },
  { id: 'burger', label: 'Hambúrguer', price: 8 },
]

/** Quantas vezes o mesmo adicional pode entrar num lanche. */
export const MAX_EXTRA_QTY = 3

const EXTRA_BY_ID = new Map(EXTRAS.map((e) => [e.id, e]))

/**
 * Normaliza o que veio do carrinho: descarta id desconhecido e quantidade
 * fora da faixa, e devolve na ordem de `EXTRAS` — assim o mesmo lanche com
 * os mesmos adicionais sempre gera a mesma lista, seja qual for a ordem em
 * que o cliente tocou nos botões.
 */
export function normalizeExtras(input) {
  const qtyById = new Map()
  if (Array.isArray(input)) {
    for (const raw of input) {
      const id = String(raw?.id || '')
      if (!EXTRA_BY_ID.has(id)) continue
      const qty = Math.floor(Number(raw?.qty) || 0)
      if (qty <= 0) continue
      qtyById.set(id, Math.min(MAX_EXTRA_QTY, (qtyById.get(id) || 0) + qty))
    }
  }
  return EXTRAS.filter((e) => qtyById.has(e.id)).map((e) => ({
    id: e.id,
    name: e.label,
    price: e.price,
    qty: Math.min(MAX_EXTRA_QTY, qtyById.get(e.id)),
  }))
}

/** Soma dos adicionais de *uma* unidade do lanche. */
export const extrasTotal = (extras) =>
  (extras || []).reduce((sum, e) => sum + e.price * e.qty, 0)

/** "2x Bacon, 1x Hambúrguer" — para listas de pedido e WhatsApp. */
export const describeExtras = (extras) =>
  (extras || []).map((e) => `${e.qty}x ${e.name}`).join(', ')
