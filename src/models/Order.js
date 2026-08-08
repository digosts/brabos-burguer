import { randomUUID } from 'node:crypto'
import mongoose from 'mongoose'
import { ORDER_STATUS } from '@/lib/orderStatus'

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    // Nome e preço ficam gravados no pedido: se você mudar o preço do
    // produto depois, o histórico do cliente continua correto.
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    notes: { type: String, trim: true, default: '' },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    // Número curto mostrado ao cliente e na produção (#1001, #1002...).
    code: { type: Number, required: true, unique: true, index: true },

    /**
     * Chave de acompanhamento do pedido, sorteada na criação.
     *
     * É o que permite a quem pediu sem conta ver o andamento: o navegador
     * dele guarda este UUID e consulta o status com ele. Como o `code` é
     * sequencial e fácil de adivinhar, ele não serve para isso — daí um
     * valor aleatório à parte.
     *
     * `sparse` porque os pedidos criados antes deste campo não têm um, e
     * sem isso o índice único brigaria com eles.
     */
    trackingId: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      sparse: true,
      index: true,
    },

    /**
     * Fica nulo nos pedidos feitos sem login — a loja aceita pedido de quem
     * entra direto pelo cardápio, sem conta. Quem tem conta continua com o
     * pedido amarrado ao usuário, que é o que alimenta a tela "Pedidos".
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    // Snapshot dos dados de contato no momento do pedido. No pedido sem
    // login é o que o cliente digitou no carrinho.
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(v) => v.length > 0, 'O pedido precisa ter pelo menos um item'],
    },

    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },

    paymentMethod: {
      type: String,
      required: true,
      enum: ['pix', 'credit', 'debit'],
    },

    // "Troco para quanto?" — só usado quando o pagamento é PIX/dinheiro.
    changeFor: { type: Number, default: null },

    address: {
      street: { type: String, required: true, trim: true },
      number: { type: String, required: true, trim: true },
      neighborhood: { type: String, required: true, trim: true },
      complement: { type: String, trim: true, default: '' },
      reference: { type: String, trim: true, default: '' },
    },

    notes: { type: String, trim: true, default: '' },

    status: {
      type: String,
      enum: Object.keys(ORDER_STATUS),
      // Nasce aguardando alguém da loja confirmar — ver o comentário em
      // ORDER_STATUS. A rota também define isto explicitamente; o default
      // existe para que nenhum caminho futuro crie pedido já em preparação.
      default: 'awaiting_confirmation',
      index: true,
    },

    // Guardamos a mensagem enviada ao WhatsApp para reenvio/auditoria.
    whatsappMessage: { type: String, default: '' },
  },
  { timestamps: true, collection: 'orders' }
)

orderSchema.index({ user: 1, createdAt: -1 })

/**
 * Sustenta a checagem de "já existe pedido não confirmado deste telefone?",
 * feita em todo pedido novo. Sem ela a consulta varre a coleção de pedidos —
 * um custo que cresce com o movimento da loja e que aparece justamente na
 * hora de mais movimento.
 */
orderSchema.index({ customerPhone: 1, status: 1 })

export default mongoose.models.Order || mongoose.model('Order', orderSchema)
