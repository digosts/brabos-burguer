import { brl, formatPhone } from './format'
import { PAYMENT_LABEL } from '@/lib/orderStatus'

const LINE = '━━━━━━━━━━━━━━━━━━━━'

/**
 * Monta a mensagem que chega no WhatsApp da produção.
 * O `*texto*` vira negrito no WhatsApp.
 */
export function buildWhatsAppMessage(order, shopName = 'Burger House') {
  const L = []

  L.push(`🍔 *NOVO PEDIDO #${order.code}*`)
  L.push(`_${shopName}_`)
  L.push(LINE)
  L.push('')

  L.push(`👤 *Cliente:* ${order.customerName}`)
  L.push(`📱 *Telefone:* ${formatPhone(order.customerPhone)}`)
  L.push('')

  L.push('🛒 *ITENS DO PEDIDO*')
  for (const item of order.items) {
    L.push(`*${item.qty}x* ${item.name} — ${brl(item.price * item.qty)}`)
    if (item.notes) L.push(`     ↳ _${item.notes}_`)
  }
  L.push('')

  L.push(LINE)
  L.push(`Subtotal: ${brl(order.subtotal)}`)
  if (order.deliveryFee > 0) L.push(`Taxa de entrega: ${brl(order.deliveryFee)}`)
  L.push(`💰 *TOTAL: ${brl(order.total)}*`)
  L.push('')

  L.push(`💳 *Pagamento:* ${PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}`)
  L.push('⚠️ _Pagamento realizado na entrega_')
  if (order.changeFor) L.push(`💵 *Troco para:* ${brl(order.changeFor)}`)
  L.push('')

  L.push(LINE)
  L.push('📍 *ENDEREÇO DE ENTREGA*')
  L.push(`Rua: *${order.address.street}, ${order.address.number}*`)
  L.push(`Bairro: *${order.address.neighborhood}*`)
  if (order.address.complement) L.push(`Complemento: ${order.address.complement}`)
  if (order.address.reference) L.push(`Referência: ${order.address.reference}`)

  if (order.notes) {
    L.push('')
    L.push(`📝 *OBSERVAÇÕES:* ${order.notes}`)
  }

  L.push('')
  L.push(LINE)
  L.push(`🕒 Pedido feito em ${new Date(order.createdAt || Date.now()).toLocaleString('pt-BR')}`)

  return L.join('\n')
}

/** Link universal do WhatsApp — funciona no app instalado, no web e no desktop. */
export function buildWhatsAppUrl(number, message) {
  const digits = String(number || '').replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
