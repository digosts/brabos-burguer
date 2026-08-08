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

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Snapshot dos dados de contato no momento do pedido.
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
      default: 'preparing',
      index: true,
    },

    // Guardamos a mensagem enviada ao WhatsApp para reenvio/auditoria.
    whatsappMessage: { type: String, default: '' },
  },
  { timestamps: true, collection: 'orders' }
)

orderSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.Order || mongoose.model('Order', orderSchema)
