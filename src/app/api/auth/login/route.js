import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { comparePassword, setSessionCookie } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Informe e-mail e senha.' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')

    // Mensagem genérica de propósito: não revela se o e-mail existe.
    if (!user || !(await comparePassword(password, user.password))) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
    }

    await setSessionCookie(user._id)
    return NextResponse.json({ user: user.toPublic() })
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: 'Não foi possível entrar. Tente novamente.' }, { status: 500 })
  }
}
