import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { hashPassword, hashResetToken, setSessionCookie } from '@/lib/auth'
import { clientIp } from '@/lib/rateLimit'
import { logAudit } from '@/lib/audit'

export async function POST(request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Link inválido.' }, { status: 400 })
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'A senha precisa ter no mínimo 6 caracteres.' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({
      resetTokenHash: hashResetToken(token),
      resetTokenExpiresAt: { $gt: new Date() },
    }).select('+resetTokenHash +resetTokenExpiresAt')

    if (!user) {
      return NextResponse.json(
        { error: 'Este link expirou ou já foi usado. Peça um novo.' },
        { status: 400 }
      )
    }

    user.password = await hashPassword(password)
    // Derruba todas as sessões antigas. Quem redefine a senha em geral está
    // justamente tentando expulsar alguém — se os tokens antigos continuassem
    // válidos, a redefinição não resolveria nada.
    user.tokenVersion = (user.tokenVersion || 0) + 1
    user.resetTokenHash = undefined
    user.resetTokenExpiresAt = undefined
    await user.save()

    await logAudit({ action: 'password.reset', user, ip: clientIp(request) })

    // Já entra logado após redefinir — um passo menos para o cliente. O cookie
    // é emitido depois do incremento, então nasce com a versão nova.
    await setSessionCookie(user)
    return NextResponse.json({ user: user.toPublic() })
  } catch (err) {
    console.error('[reset]', err)
    return NextResponse.json({ error: 'Não foi possível redefinir a senha.' }, { status: 500 })
  }
}
