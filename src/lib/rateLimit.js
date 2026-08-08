import { NextResponse } from 'next/server'
import { connectDB } from './mongodb'
import RateLimit from '@/models/RateLimit'

/**
 * Limitador de frequência de janela fixa.
 *
 * Cada chave conta as requisições de uma janela de `windowMs`. Passou de
 * `limit`, as próximas são recusadas até a janela virar.
 *
 * As janelas são fatias fixas do relógio, não contadas a partir da primeira
 * requisição. A consequência conhecida: quem acertar a virada consegue até
 * o dobro do limite em pouco tempo — `limit` no fim de uma fatia e `limit` no
 * começo da seguinte. Para o que estas rotas protegem isso não muda nada; o
 * que interessa é barrar as centenas, não as seis.
 *
 * Decisão importante: se o Mongo estiver fora, isto **libera** a requisição.
 * Numa hamburgueria, um banco instável não pode virar "ninguém consegue
 * pedir" — o limitador protege de abuso, não é o que sustenta o pedido. A
 * falha vai para o log para você notar que a proteção está cega.
 */
export async function rateLimit(key, { limit, windowMs }, _retry = false) {
  try {
    await connectDB()

    /**
     * A janela vai no nome do documento, não dentro dele.
     *
     * O tempo é fatiado em blocos de `windowMs` e cada bloco tem o seu
     * contador — `order:ip:1.2.3.4:29411`. Assim a contagem inteira cabe num
     * único `$inc` atômico, sem nenhum caminho que "reinicie" o contador.
     *
     * A primeira versão guardava a janela dentro do documento e a reiniciava
     * quando vencia. Parecia equivalente e não era: dez requisições
     * simultâneas numa chave nova não encontravam documento nenhum, todas
     * caíam no ramo de reinício e todas gravavam `count: 1` por cima uma da
     * outra — as dez passavam, com limite 5. E rajada simultânea é exatamente
     * o formato de um ataque, não de um cliente com fome.
     */
    const bucket = Math.floor(Date.now() / windowMs)
    const endsAt = new Date((bucket + 1) * windowMs)

    const doc = await RateLimit.findOneAndUpdate(
      { key: `${key}:${bucket}` },
      { $inc: { count: 1 }, $setOnInsert: { resetAt: endsAt } },
      { upsert: true, new: true }
    )

    if (doc.count <= limit) return { ok: true }
    return { ok: false, retryAfter: retryAfterSeconds(endsAt) }
  } catch (err) {
    // Duas requisições simultâneas podem disputar a criação do documento e
    // uma delas bate no índice único. O documento existe agora: repetir a
    // chamada cai no `$inc` e conta certo. Só uma vez, para não virar laço.
    if (err?.code === 11000 && !_retry) {
      return rateLimit(key, { limit, windowMs }, true)
    }
    if (err?.code !== 11000) console.error('[rateLimit] indisponível:', err)
    return { ok: true }
  }
}

function retryAfterSeconds(endsAt) {
  return Math.max(1, Math.ceil((endsAt.getTime() - Date.now()) / 1000))
}

/**
 * IP de quem chamou.
 *
 * `x-forwarded-for` só é confiável porque a aplicação fica atrás de um proxy
 * (Vercel) que reescreve o cabeçalho. Rodando exposto direto na internet, esse
 * valor passa a ser escolhido pelo cliente e o limite por IP deixa de valer.
 */
export function clientIp(request) {
  const headers = request.headers
  const forwarded =
    headers.get('x-vercel-forwarded-for') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')

  return forwarded?.split(',')[0].trim() || 'desconhecido'
}

/** Resposta padrão de "devagar aí". */
export function tooManyRequests(message, retryAfter) {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: retryAfter ? { 'Retry-After': String(retryAfter) } : undefined }
  )
}

/**
 * Aplica vários limites de uma vez e devolve a primeira recusa.
 *
 * Cada rota combina duas chaves — uma por IP, outra pela identidade que o
 * corpo traz (e-mail, telefone). Sozinha, a chave por IP erra em prédio ou
 * rede móvel, onde muita gente sai pelo mesmo endereço.
 */
export async function checkLimits(limits) {
  for (const { key, limit, windowMs } of limits) {
    const result = await rateLimit(key, { limit, windowMs })
    if (!result.ok) return result
  }
  return { ok: true }
}

export const MINUTE = 60_000
export const HOUR = 60 * MINUTE
