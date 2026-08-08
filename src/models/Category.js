import mongoose from 'mongoose'

/**
 * Você cria as categorias manualmente no MongoDB (Atlas > Browse Collections
 * > categories > Insert Document). Formato mínimo:
 *
 * {
 *   "name": "Hambúrgueres",
 *   "order": 1,
 *   "active": true
 * }
 */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // Texto curto que aparece abaixo do nome da categoria (opcional).
    description: { type: String, trim: true, default: '' },

    // Emoji ou 1-2 letras mostradas no chip da categoria (opcional).
    icon: { type: String, trim: true, default: '' },

    // Menor primeiro. Define a ordem das seções na tela inicial.
    order: { type: Number, default: 0, index: true },

    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: 'categories' }
)

export default mongoose.models.Category || mongoose.model('Category', categorySchema)
