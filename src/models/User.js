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
