import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { hashPassword, setSessionCookie } from '@/lib/auth'
import { isValidEmail } from '@/lib/format'

export async function POST(request) {
  try {
    const { name, email, phone, password } = await request.json()

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
    }
    if (String(phone).replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Telefone inválido. Informe DDD + número.' }, { status: 400 })
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'A senha precisa ter no mínimo 6 caracteres.' }, { status: 400 })
    }

    await connectDB()

    const normalizedEmail = email.trim().toLowerCase()
    if (await User.exists({ email: normalizedEmail })) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 })
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: String(phone).replace(/\D/g, ''),
      password: await hashPassword(password),
    })

    await setSessionCookie(user._id)
    return NextResponse.json({ user: user.toPublic() }, { status: 201 })
  } catch (err) {
    // Corrida entre dois cadastros com o mesmo e-mail cai no índice único.
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 })
    }
    console.error('[register]', err)
    return NextResponse.json({ error: 'Não foi possível criar a conta.' }, { status: 500 })
  }
}
