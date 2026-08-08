import mongoose from 'mongoose'

/**
 * Você cria os produtos manualmente no MongoDB. Formato mínimo:
 *
 * {
 *   "name": "X-Bacon",
 *   "description": "Pão brioche, blend 180g, cheddar, bacon crocante",
 *   "price": 32.9,
 *   "image": "https://.../x-bacon.jpg",
 *   "category": { "$oid": "COLE_AQUI_O_ID_DA_CATEGORIA" },
 *   "active": true
 * }
 *
 * O campo `category` precisa ser o _id de um documento de `categories`.
 */
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },

    // Em reais. Aceita decimal: 32.9 == R$ 32,90
    price: { type: Number, required: true, min: 0 },

    // Preço antigo (opcional). Se maior que `price`, o app mostra
    // o valor riscado e uma etiqueta de promoção.
    oldPrice: { type: Number, min: 0, default: null },

    // URL completa de uma imagem hospedada em qualquer lugar.
    image: { type: String, trim: true, default: '' },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },

    // Destaca o produto com uma etiqueta na tela inicial (opcional).
    tag: { type: String, trim: true, default: '' },

    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: 'products' }
)

export default mongoose.models.Product || mongoose.model('Product', productSchema)
