import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { createResetToken } from '@/lib/auth'
import { isMailConfigured, sendResetEmail } from '@/lib/mailer'
import { SHOP } from '@/lib/shop'

export async function POST(request) {
  try {
    const { email } = await request.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Informe seu e-mail.' }, { status: 400 })
    }

    await connectDB()
    const user = await User.findOne({ email: email.trim().toLowerCase() })

    // Resposta idêntica exista ou não a conta: evita descobrir e-mails cadastrados.
    const genericOk = { ok: true, message: 'Se este e-mail estiver cadastrado, enviamos as instruções.' }
    if (!user) return NextResponse.json(genericOk)

    const { token, tokenHash, expiresAt } = createResetToken()
    user.resetTokenHash = tokenHash
    user.resetTokenExpiresAt = expiresAt
    await user.save()

    const origin = request.headers.get('origin') || new URL(request.url).origin
    const resetUrl = `${origin}/redefinir-senha/${token}`

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
