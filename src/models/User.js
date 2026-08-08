import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, default: '' },
    number: { type: String, trim: true, default: '' },
    neighborhood: { type: String, trim: true, default: '' },
    complement: { type: String, trim: true, default: '' },
    reference: { type: String, trim: true, default: '' },
  },
  { _id: false }
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },

    /**
     * Quem pode administrar os pedidos da loja.
     *
     * Só é alterado pelo script `npm run admin` (acesso direto ao banco).
     * Nenhuma rota da API lê este campo do corpo da requisição — o cadastro
     * e o perfil montam o documento com campos explícitos, então mandar
     * `{"role":"admin"}` num POST não tem efeito nenhum.
     */
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
      index: true,
    },

    // Último endereço usado — pré-preenche o checkout na próxima compra.
    address: { type: addressSchema, default: () => ({}) },

    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
  },
  { timestamps: true }
)

userSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    // Só para a interface decidir o que desenhar. Quem autoriza de verdade
    // é o servidor, a cada requisição — nunca este campo.
    isAdmin: this.role === 'admin',
    address: {
      street: this.address?.street || '',
      number: this.address?.number || '',
      neighborhood: this.address?.neighborhood || '',
      complement: this.address?.complement || '',
      reference: this.address?.reference || '',
    },
    createdAt: this.createdAt,
  }
}

export default mongoose.models.User || mongoose.model('User', userSchema)
