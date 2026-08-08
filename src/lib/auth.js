import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { connectDB } from './mongodb'
import User from '@/models/User'

const COOKIE_NAME = 'burger_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 dias

function secret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET não definida no ambiente')
  return s
}

/**
 * Falha antes de qualquer escrita no banco.
 * Sem isso, um ambiente sem JWT_SECRET criaria o usuário e só então
 * estouraria ao assinar o cookie — deixando a conta órfã e o e-mail
 * preso pelo índice único na segunda tentativa.
 */
export function assertAuthConfigured() {
  secret()
}

export function hashPassword(plain) {
  return bcrypt.hash(plain, 10)
}

export function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, secret(), { expiresIn: MAX_AGE_SECONDS })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, secret())
  } catch {
    return null
  }
}

/** Grava o cookie de sessão (httpOnly — inacessível ao JavaScript do cliente). */
export async function setSessionCookie(userId) {
  const store = await cookies()
  store.set(COOKIE_NAME, signToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.set(COOKIE_NAME, '', { path: '/', maxAge: 0 })
}

/**
 * Verifica só a assinatura do cookie, sem consultar o MongoDB.
 * Usado nos redirecionamentos de rota, onde não precisamos dos dados
 * do usuário — evita uma ida ao banco em cada navegação.
 */
export async function hasValidSession() {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  return Boolean(token && verifyToken(token))
}

/** Retorna o documento do usuário logado, ou null. */
export async function getCurrentUser() {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload?.sub) return null

  await connectDB()
  return User.findById(payload.sub)
}

/**
 * Ponto único de autorização do admin.
 *
 * Devolve o documento do usuário só se ele for admin — caso contrário null.
 * Consulta sempre o banco (via `getCurrentUser`), nunca o cookie: o papel é
 * lido do documento no momento da requisição, então revogar um admin no
 * banco tem efeito imediato, sem esperar a sessão expirar.
 *
 * Toda rota e toda tela do /admin passa por aqui. Esconder o botão no menu
 * é só cosmético; a barreira real é esta função.
 */
export async function getCurrentAdmin() {
  const user = await getCurrentUser()
  return user?.role === 'admin' ? user : null
}

/** Token de redefinição de senha: guardamos só o hash no banco. */
export function createResetToken() {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  return { token, tokenHash, expiresAt: new Date(Date.now() + 1000 * 60 * 30) } // 30 min
}

export function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
