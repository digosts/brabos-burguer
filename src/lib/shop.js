/** Configuração da loja, lida do .env.local. */

const num = (v, fallback) => {
  const n = Number(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : fallback
}

export const SHOP = {
  name: process.env.NEXT_PUBLIC_SHOP_NAME || 'Burger House',
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, ''),
  deliveryFee: num(process.env.NEXT_PUBLIC_DELIVERY_FEE, 0),
  minOrder: num(process.env.NEXT_PUBLIC_MIN_ORDER, 0),
}

export const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX', hint: 'QR Code na entrega', icon: 'pix' },
  { value: 'credit', label: 'Crédito', hint: 'Maquininha na entrega', icon: 'card' },
  { value: 'debit', label: 'Débito', hint: 'Maquininha na entrega', icon: 'card' },
]
