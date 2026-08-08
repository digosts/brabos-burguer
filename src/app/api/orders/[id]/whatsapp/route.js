import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import { getCurrentUser } from '@/lib/auth'
import { SHOP } from '@/lib/shop'
import { buildWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp'

/** Reenviar um pedido já feito pelo WhatsApp (caso o cliente feche o app antes de enviar). */
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { id } = await params
    await connectDB()

    // O filtro por `user` impede que alguém leia o pedido de outra pessoa.
    const order = await Order.findOne({ _id: id, user: user._id })
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })

    // Remontamos sempre em vez de usar `order.whatsappMessage`: os pedidos
    // antigos foram salvos com emoji, que chegava quebrado no WhatsApp.
    // O campo salvo continua no banco só para auditoria.
    const message = buildWhatsAppMessage(order, SHOP.name, SHOP.pixKey)

    return NextResponse.json({
      whatsappUrl: SHOP.whatsapp ? buildWhatsAppUrl(SHOP.whatsapp, message) : null,
      whatsappMessage: message,
    })
  } catch (err) {
    console.error('[orders:whatsapp]', err)
    return NextResponse.json({ error: 'Não foi possível gerar a mensagem.' }, { status: 500 })
  }
}
