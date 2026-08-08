import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { hashPassword, hashResetToken, setSessionCookie } from '@/lib/auth'

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
    user.resetTokenHash = undefined
    user.resetTokenExpiresAt = undefined
    await user.save()

    // Já entra logado após redefinir — um passo menos para o cliente.
    await setSessionCookie(user._id)
    return NextResponse.json({ user: user.toPublic() })
  } catch (err) {
    console.error('[reset]', err)
    return NextResponse.json({ error: 'Não foi possível redefinir a senha.' }, { status: 500 })
  }
}
