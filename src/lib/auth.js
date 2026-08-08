import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { connectDB } from './mongodb'
import User from '@/models/User'

const COOKIE_NAME = 'burger_session'

/**
 * Duração da sessão, por papel.
 *
 * O cliente fica logado um mês — reentrar a cada pedido só atrapalharia. O
 * admin, não: a sessão dele abre a base inteira de clientes e a fila da loja.
 * Um mês de validade significa que o celular esquecido no balcão continua
 * sendo uma porta aberta até setembro. Doze horas cobrem um dia de trabalho.
 */
const CUSTOMER_MAX_AGE = 60 * 60 * 24 * 30 // 30 dias
const ADMIN_MAX_AGE = 60 * 60 * 12 // 12 horas

const maxAgeFor = (user) => (user?.role === 'admin' ? ADMIN_MAX_AGE : CUSTOMER_MAX_AGE)

/** Atributos do cookie de sessão — os mesmos ao gravar e ao apagar. */
const cookieOptions = (maxAge) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge,
})

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

/**
 * `v` carrega a versão da sessão do usuário. Ver `tokenVersion` no model:
 * é o que permite invalidar tokens já emitidos.
 */
export function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), v: user.tokenVersion ?? 0 },
    secret(),
    { expiresIn: maxAgeFor(user) }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, secret())
  } catch {
    return null
  }
}

/**
 * Grava o cookie de sessão (httpOnly — inacessível ao JavaScript do cliente).
 *
 * Recebe o documento do usuário, não só o id: o papel define quanto tempo a
 * sessão dura, e a `tokenVersion` entra na assinatura.
 */
export async function setSessionCookie(user) {
  const store = await cookies()
  store.set(COOKIE_NAME, signToken(user), cookieOptions(maxAgeFor(user)))
}

/**
 * Apaga o cookie repetindo os mesmos atributos da gravação.
 *
 * Não é detalhe: o navegador só sobrescreve um cookie quando nome, domínio e
 * caminho batem, e alguns descartam a resposta se `secure`/`sameSite`
 * divergirem. Sem isso o "sair" mostrava a tela de deslogado com a sessão
 * ainda válida no cookie.
 */
export async function clearSessionCookie() {
  const store = await cookies()
  store.set(COOKIE_NAME, '', cookieOptions(0))
}

/**
 * Retorna o documento do usuário logado, ou null.
 *
 * É o único jeito de responder "quem está aí?". Existia um `hasValidSession`
 * que conferia só a assinatura do cookie, para poupar uma consulta; com a
 * `tokenVersion` ele passou a mentir, porque um cookie revogado continua com
 * assinatura boa. Foi removido em vez de corrigido: um atalho barato e errado
 * exposto na API é um convite a reintroduzir o problema.
 */
export async function getCurrentUser() {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload?.sub) return null

  await connectDB()
  const user = await User.findById(payload.sub)
  if (!user) return null

  /**
   * Token emitido antes da última troca de senha não vale mais.
   *
   * É o que faz "trocar a senha" expulsar de verdade quem estava dentro. Sem
   * esta linha, quem tivesse roubado a sessão continuaria navegando por até
   * 30 dias mesmo depois de o dono perceber e mudar a senha.
   */
  if ((payload.v ?? 0) !== (user.tokenVersion ?? 0)) return null

  return user
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
