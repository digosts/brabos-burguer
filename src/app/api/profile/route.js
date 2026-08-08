import { NextResponse } from 'next/server'
import { getCurrentUser, hashPassword, comparePassword } from '@/lib/auth'
import User from '@/models/User'

export async function PATCH(request) {
  try {
    const current = await getCurrentUser()
    if (!current) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { name, phone, address, currentPassword, newPassword } = await request.json()

    // Recarrega com a senha para poder validar a troca.
    const user = await User.findById(current._id).select('+password')

    if (name !== undefined) {
      if (!String(name).trim()) {
        return NextResponse.json({ error: 'O nome não pode ficar vazio.' }, { status: 400 })
      }
      user.name = String(name).trim()
    }

    if (phone !== undefined) {
      const digits = String(phone).replace(/\D/g, '')
      if (digits.length < 10) {
        return NextResponse.json({ error: 'Telefone inválido. Informe DDD + número.' }, { status: 400 })
      }

      // Sem isto, dava para contornar a regra do cadastro: criar a conta com
      // um telefone livre e depois editá-la para o telefone de outra pessoa.
      if (digits !== user.phone) {
        const taken = await User.exists({ phone: digits, _id: { $ne: user._id } })
        if (taken) {
          return NextResponse.json(
            { error: 'Este telefone já está cadastrado em outra conta.', field: 'phone' },
            { status: 409 }
          )
        }
      }

      user.phone = digits
    }

    if (address !== undefined) {
      user.address = {
        street: address?.street?.trim() || '',
        number: address?.number?.trim() || '',
        neighborhood: address?.neighborhood?.trim() || '',
        complement: address?.complement?.trim() || '',
        reference: address?.reference?.trim() || '',
      }
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Informe sua senha atual.' }, { status: 400 })
      }
      if (!(await comparePassword(currentPassword, user.password))) {
        return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 })
      }
      if (String(newPassword).length < 6) {
        return NextResponse.json(
          { error: 'A nova senha precisa ter no mínimo 6 caracteres.' },
          { status: 400 }
        )
      }
      user.password = await hashPassword(newPassword)
    }

    await user.save()
    return NextResponse.json({ user: user.toPublic() })
  } catch (err) {
    // Mesma corrida do cadastro: duas edições simultâneas só colidem no índice.
    if (err?.code === 11000) {
      return NextResponse.json(
        { error: 'Este telefone já está cadastrado em outra conta.', field: 'phone' },
        { status: 409 }
      )
    }
    console.error('[profile:PATCH]', err)
    return NextResponse.json({ error: 'Não foi possível salvar as alterações.' }, { status: 500 })
  }
}
