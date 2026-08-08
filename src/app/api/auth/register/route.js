import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { assertAuthConfigured, hashPassword, setSessionCookie } from '@/lib/auth'
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

    assertAuthConfigured()
    await connectDB()

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedPhone = String(phone).replace(/\D/g, '')

    // E-mail e telefone identificam o cliente na entrega: nenhum dos dois
    // pode se repetir. Esta checagem dá a mensagem clara; quem garante de
    // verdade são os índices únicos, logo abaixo no catch.
    const [emailTaken, phoneTaken] = await Promise.all([
      User.exists({ email: normalizedEmail }),
      User.exists({ phone: normalizedPhone }),
    ])

    if (emailTaken) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado.', field: 'email' },
        { status: 409 }
      )
    }
    if (phoneTaken) {
      return NextResponse.json(
        { error: 'Este telefone já está cadastrado.', field: 'phone' },
        { status: 409 }
      )
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: await hashPassword(password),
    })

    await setSessionCookie(user._id)
    return NextResponse.json({ user: user.toPublic() }, { status: 201 })
  } catch (err) {
    // Dois cadastros simultâneos passam pela checagem acima e só colidem
    // aqui, no índice único. `keyPattern` diz qual campo bateu — sem isso
    // uma colisão de telefone reportaria "e-mail já cadastrado".
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] === 'phone' ? 'phone' : 'email'
      return NextResponse.json(
        {
          error:
            field === 'phone'
              ? 'Este telefone já está cadastrado.'
              : 'Este e-mail já está cadastrado.',
          field,
        },
        { status: 409 }
      )
    }
    console.error('[register]', err)
    return NextResponse.json({ error: 'Não foi possível criar a conta.' }, { status: 500 })
  }
}
