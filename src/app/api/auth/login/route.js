import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { comparePassword, setSessionCookie } from '@/lib/auth'
import { checkLimits, clientIp, tooManyRequests, MINUTE } from '@/lib/rateLimit'
import { logAudit, logAuditThrottled } from '@/lib/audit'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Informe e-mail e senha.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const ip = clientIp(request)

    /**
     * Barreira antes do bcrypt, e não depois.
     *
     * Comparar uma senha custa ~100ms de CPU de propósito — é o que torna a
     * senha cara de adivinhar. Só que isso também faz de cada tentativa um
     * pequeno ataque: sem limite, algumas centenas de requisições por segundo
     * ocupam o servidor inteiro sem precisar acertar senha nenhuma.
     *
     * O limite por e-mail segura a força bruta contra uma conta específica
     * (a do admin, na prática). O limite por IP, mais frouxo, segura quem
     * varre várias contas do mesmo lugar.
     */
    const limited = await checkLimits([
      { key: `login:email:${normalizedEmail}`, limit: 5, windowMs: 15 * MINUTE },
      { key: `login:ip:${ip}`, limit: 20, windowMs: 15 * MINUTE },
    ])

    if (!limited.ok) {
      await logAuditThrottled({
        throttleKey: `login_rl:${normalizedEmail}`,
        windowMs: 15 * MINUTE,
        action: 'login.rate_limited',
        ip,
        detail: { email: normalizedEmail },
      })
      return tooManyRequests(
        'Muitas tentativas de entrada. Aguarde alguns minutos e tente de novo.',
        limited.retryAfter
      )
    }

    await connectDB()

    const user = await User.findOne({ email: normalizedEmail }).select('+password')

    // Mensagem genérica de propósito: não revela se o e-mail existe.
    if (!user || !(await comparePassword(password, user.password))) {
      await logAudit({ action: 'login.failed', ip, detail: { email: normalizedEmail } })
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
    }

    await setSessionCookie(user)

    // Entrada de admin é registrada sempre: é o evento que você quer poder
    // conferir depois, se algum dia desconfiar de acesso indevido ao painel.
    if (user.role === 'admin') {
      await logAudit({ action: 'login.admin', user, ip })
    }

    return NextResponse.json({ user: user.toPublic() })
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: 'Não foi possível entrar. Tente novamente.' }, { status: 500 })
  }
}
