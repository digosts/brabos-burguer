import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

/**
 * O Next recarrega os módulos a cada hot-reload em desenvolvimento.
 * Guardamos a conexão no objeto `global` para não abrir uma nova a
 * cada alteração de arquivo (o Atlas limita conexões simultâneas).
 */
let cached = global._mongoose

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  if (cached.conn) return cached.conn

  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI não definida. Copie .env.example para .env.local e preencha a string de conexão.'
    )
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => m)
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    // Sem isso, uma falha de conexão ficaria em cache para sempre
    // e o app só voltaria após um restart do servidor.
    cached.promise = null
    throw err
  }

  return cached.conn
}

export default connectDB
