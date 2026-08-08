import { brl, formatPhone } from './format'
import { PAYMENT_LABEL } from '@/lib/orderStatus'

const LINE = '--------------------'

/**
 * A decoração da mensagem é toda ASCII (sem emoji, sem `━`, sem `↳`, sem `—`).
 * Os clientes do WhatsApp decodificam o `text=` do link de forma inconsistente
 * e transformavam esses caracteres em `�` na hora que a mensagem chegava.
 *
 * Além dos emojis, tiramos os espaços fixos que vêm do `toLocaleString`:
 * U+00A0 (no-break space, usado no "R$ 28,90") e U+202F (narrow no-break
 * space, que o ICU novo usa nas datas). Ambos viram espaço comum.
 */
const asciiSafe = (value) => String(value ?? '').replace(/[  ]/g, ' ')

const money = (value) => asciiSafe(brl(value))

/**
 * Monta a mensagem que chega no WhatsApp da produção.
 * O `*texto*` vira negrito e o `_texto_` vira itálico no WhatsApp.
 */
export function buildWhatsAppMessage(order, shopName = 'Burger House') {
  const L = []

  L.push(`*NOVO PEDIDO #${order.code}*`)
  L.push(`_${shopName}_`)
  L.push(LINE)
  L.push('')

  L.push(`*Cliente:* ${asciiSafe(order.customerName)}`)
  L.push(`*Telefone:* ${formatPhone(order.customerPhone)}`)
  L.push('')

  L.push('*ITENS DO PEDIDO*')
  for (const item of order.items) {
    L.push(`*${item.qty}x* ${asciiSafe(item.name)} - ${money(item.price * item.qty)}`)
    if (item.notes) L.push(`    > _${asciiSafe(item.notes)}_`)
  }
  L.push('')

  L.push(LINE)
  L.push(`Subtotal: ${money(order.subtotal)}`)
  if (order.deliveryFee > 0) L.push(`Taxa de entrega: ${money(order.deliveryFee)}`)
  L.push(`*TOTAL: ${money(order.total)}*`)
  L.push('')

  L.push(`*Pagamento:* ${PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}`)
  L.push('_Pagamento realizado na entrega_')
  if (order.changeFor) L.push(`*Troco para:* ${money(order.changeFor)}`)
  L.push('')

  L.push(LINE)
  L.push('*ENDEREÇO DE ENTREGA*')
  L.push(`Rua: *${asciiSafe(order.address.street)}, ${asciiSafe(order.address.number)}*`)
  L.push(`Bairro: *${asciiSafe(order.address.neighborhood)}*`)
  if (order.address.complement) L.push(`Complemento: ${asciiSafe(order.address.complement)}`)
  if (order.address.reference) L.push(`Referência: ${asciiSafe(order.address.reference)}`)

  if (order.notes) {
    L.push('')
    L.push(`*OBSERVAÇÕES:* ${asciiSafe(order.notes)}`)
  }

  L.push('')
  L.push(LINE)
  const createdAt = new Date(order.createdAt || Date.now()).toLocaleString('pt-BR')
  L.push(`Pedido feito em ${asciiSafe(createdAt)}`)

  return L.join('\n')
}

/** Link universal do WhatsApp — funciona no app instalado, no web e no desktop. */
export function buildWhatsAppUrl(number, message) {
  const digits = String(number || '').replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
