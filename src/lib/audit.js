import { connectDB } from './mongodb'
import { rateLimit } from './rateLimit'
import AuditLog from '@/models/AuditLog'

/**
 * Grava um evento na trilha de auditoria.
 *
 * Nunca lança. Auditoria é registro do que aconteceu, não parte do que
 * acontece: se a gravação falhar, o pedido do cliente segue igual e o
 * problema vai para o log do servidor. O contrário — um erro aqui derrubar a
 * entrega de um pedido — seria uma troca ruim.
 */
export async function logAudit({ action, user = null, order = null, ip = '', detail = null }) {
  try {
    await connectDB()
    await AuditLog.create({
      action,
      user: user?._id || null,
      userEmail: user?.email || '',
      order: order?._id || null,
      orderCode: order?.code ?? null,
      ip,
      detail,
    })
  } catch (err) {
    console.error('[audit] não foi possível registrar:', action, err)
  }
}

/**
 * Registra no máximo uma vez por janela, para a mesma chave.
 *
 * Serve para os eventos que nascem justamente de um excesso — "recusado por
 * limite de frequência". Registrar cada um deles seria um tiro no pé: quem
 * está inundando a rota levaria 429 em toda requisição e, a cada 429,
 * ganharia uma gravação no seu banco. O ataque que o limitador bloqueia
 * voltaria pela porta dos fundos, como escrita.
 *
 * Uma linha por janela basta: o que interessa é saber que aconteceu, não
 * contar as tentativas.
 */
export async function logAuditThrottled({ throttleKey, windowMs, ...entry }) {
  const first = await rateLimit(`audit:${throttleKey}`, { limit: 1, windowMs })
  if (first.ok) await logAudit(entry)
}
