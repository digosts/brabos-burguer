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
  // Chave PIX enviada na mensagem do WhatsApp quando o cliente escolhe PIX.
  // Vazia: a mensagem sai sem o bloco de pagamento, sem quebrar nada.
  pixKey: (process.env.NEXT_PUBLIC_PIX_KEY || '17991238343').trim(),
  // Chave PIX como aparece nos textos da tela.
  pixKeyLabel: '(17)99123-8343',

  /**
   * Modo de atendimento atual. Troque para `false` quando voltar a ter
   * entrega / outras formas de pagamento — o resto do app se ajusta sozinho.
   *
   * pickupOnly: só retirada no local. Some o endereço do carrinho, não há
   *   taxa de entrega e os status falam em "pronto para retirada".
   * pixOnly: só PIX. Some a escolha de pagamento e o pedido já vai como PIX
   *   (a chave segue na mensagem do WhatsApp).
   */
  pickupOnly: true,
  pixOnly: true,

  // Onde retirar (opcional). Aparece no carrinho e na mensagem do WhatsApp.
  pickupAddress: (process.env.NEXT_PUBLIC_PICKUP_ADDRESS || '').trim()
}

export const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX', hint: 'Chave (17)99123-8343', icon: 'pix' },
  {
    value: 'credit',
    label: 'Crédito',
    hint: 'Maquininha na entrega',
    icon: 'card'
  },
  {
    value: 'debit',
    label: 'Débito',
    hint: 'Maquininha na entrega',
    icon: 'card'
  }
]
