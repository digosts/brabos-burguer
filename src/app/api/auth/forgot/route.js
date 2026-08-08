import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { createResetToken } from '@/lib/auth'
import { appUrl } from '@/lib/appUrl'
import { checkLimits, clientIp, tooManyRequests, HOUR } from '@/lib/rateLimit'
import { isMailConfigured, sendResetEmail } from '@/lib/mailer'
import { SHOP } from '@/lib/shop'

export async function POST(request) {
  try {
    const { email } = await request.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Informe seu e-mail.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    /**
     * Cada chamada aqui manda um e-mail de verdade para a caixa de outra
     * pessoa. Sem limite, a rota vira ferramenta de perseguição — basta
     * repetir o POST para enterrar a caixa da vítima — e ainda queima a cota
     * e a reputação do seu SMTP.
     *
     * O contador sobe antes de sabermos se a conta existe, de propósito: se
     * só contasse e-mails cadastrados, o 429 viraria um jeito de descobrir
     * quem tem conta na loja.
     */
    const limited = await checkLimits([
      { key: `forgot:email:${normalizedEmail}`, limit: 3, windowMs: HOUR },
      { key: `forgot:ip:${clientIp(request)}`, limit: 10, windowMs: HOUR },
    ])
    if (!limited.ok) {
      return tooManyRequests(
        'Já enviamos as instruções. Verifique sua caixa de entrada e o spam antes de pedir de novo.',
        limited.retryAfter
      )
    }

    await connectDB()
    const user = await User.findOne({ email: normalizedEmail })

    // Resposta idêntica exista ou não a conta: evita descobrir e-mails cadastrados.
    const genericOk = { ok: true, message: 'Se este e-mail estiver cadastrado, enviamos as instruções.' }
    if (!user) return NextResponse.json(genericOk)

    const { token, tokenHash, expiresAt } = createResetToken()
    user.resetTokenHash = tokenHash
    user.resetTokenExpiresAt = expiresAt
    await user.save()

    // Endereço fixo, de configuração. Ver o comentário em `appUrl`: derivar
    // isto do cabeçalho da requisição entrega o token de redefinição a quem
    // souber mandar um `Origin` forjado.
    const resetUrl = `${appUrl()}/redefinir-senha/${token}`

    if (isMailConfigured()) {
      try {
        await sendResetEmail({ to: user.email, name: user.name, resetUrl, shopName: SHOP.name })
      } catch (mailErr) {
        console.error('[forgot] falha ao enviar e-mail:', mailErr)
        return NextResponse.json(
          { error: 'Não conseguimos enviar o e-mail agora. Tente novamente em alguns minutos.' },
          { status: 502 }
        )
      }
      return NextResponse.json(genericOk)
    }

    // Sem SMTP configurado: em desenvolvimento devolvemos o link na tela
    // para você conseguir testar o fluxo inteiro sem servidor de e-mail.
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ ...genericOk, devResetUrl: resetUrl })
    }

    console.error('[forgot] SMTP não configurado em produção — link gerado mas não enviado.')
    return NextResponse.json(
      { error: 'Recuperação de senha indisponível. Fale com a loja pelo WhatsApp.' },
      { status: 503 }
    )
  } catch (err) {
    console.error('[forgot]', err)
    return NextResponse.json({ error: 'Não foi possível processar o pedido.' }, { status: 500 })
  }
}
