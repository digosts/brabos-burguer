'use client'

/**
 * Memória do cliente que pede sem login.
 *
 * Tudo aqui vive no localStorage do aparelho — não existe conta, não existe
 * perfil e nenhuma rota da API lê estes dados. Servem para dois confortos:
 * não obrigar a redigitar nome/endereço a cada pedido, e dar ao cliente uma
 * lista do que ele já pediu neste aparelho.
 *
 * Como é armazenamento local, some se a pessoa limpar o navegador ou trocar
 * de celular. O pedido em si não depende disso: ele fica no banco da loja.
 */

const DATA_KEY = 'burger.guest.v1'
const ORDERS_KEY = 'burger.guest.orders.v1'
const MAX_ORDERS = 20

export const EMPTY_GUEST = {
  name: '',
  phone: '',
  address: { street: '', number: '', neighborhood: '', complement: '', reference: '' },
}

/** Lê e valida o JSON salvo; qualquer sujeira vira o fallback. */
function read(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    // localStorage bloqueado (modo privado) ou JSON corrompido.
    return fallback
  }
}

function write(key, value) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* sem espaço ou bloqueado: o pedido segue normalmente */
  }
}

/** Nome, telefone e último endereço usados neste aparelho. */
export function loadGuest() {
  const saved = read(DATA_KEY, null)
  if (!saved || typeof saved !== 'object') return EMPTY_GUEST

  return {
    name: String(saved.name || ''),
    phone: String(saved.phone || ''),
    address: { ...EMPTY_GUEST.address, ...(saved.address || {}) },
  }
}

export function saveGuest({ name, phone, address }) {
  write(DATA_KEY, {
    name: String(name || '').slice(0, 80),
    phone: String(phone || '').slice(0, 20),
    address: { ...EMPTY_GUEST.address, ...(address || {}) },
  })
}

export function clearGuest() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(DATA_KEY)
    localStorage.removeItem(ORDERS_KEY)
  } catch {
    /* nada a fazer */
  }
}

/** Histórico local, do mais recente para o mais antigo. */
export function loadGuestOrders() {
  const saved = read(ORDERS_KEY, [])
  return Array.isArray(saved) ? saved : []
}

/**
 * Guarda o pedido recém-enviado junto com o link do WhatsApp já pronto.
 * Guardar o link evita precisar de uma rota nova só para reenviar a
 * mensagem: quem pediu sem login não tem como provar que o pedido é dele.
 */
export function pushGuestOrder(order, whatsappUrl) {
  const entry = {
    id: order.id,
    code: order.code,
    // Chave de acompanhamento: é o que permite perguntar ao servidor em que
    // pé está o pedido sem ter conta.
    trackingId: order.trackingId || null,
    items: order.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    paymentMethod: order.paymentMethod,
    address: order.address,
    notes: order.notes || '',
    createdAt: order.createdAt || new Date().toISOString(),
    whatsappUrl: whatsappUrl || null,
  }

  const next = [entry, ...loadGuestOrders().filter((o) => o.id !== entry.id)].slice(0, MAX_ORDERS)
  write(ORDERS_KEY, next)
  return next
}
