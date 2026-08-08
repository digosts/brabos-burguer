import mongoose from 'mongoose'

/**
 * Contador atômico para gerar o número do pedido.
 * Um `findOneAndUpdate` com `$inc` garante que dois pedidos simultâneos
 * nunca recebam o mesmo número.
 */
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 1000 },
  },
  { collection: 'counters' }
)

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema)

export async function nextOrderCode() {
  const doc = await Counter.findByIdAndUpdate(
    'orderCode',
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
  return doc.seq
}

export default Counter
