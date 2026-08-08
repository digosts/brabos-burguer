import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import { getCurrentAdmin } from '@/lib/auth'
import { clientIp } from '@/lib/rateLimit'
import { logAudit } from '@/lib/audit'
import { ADMIN_ASSIGNABLE_STATUS } from '@/lib/orderStatus'
import { serializeAdminOrder } from '@/lib/serialize'

/**
 * Muda o status de um pedido. Exclusiva do admin.
 *
 * Body: { "status": "preparing" | "on_the_way" | "delivered" | "canceled" }
 *
 * "preparing" é a confirmação do pedido: é o clique que tira o pedido da
 * espera e libera a cozinha. "canceled" é a recusa — usada no trote.
 */
export async function PATCH(request, { params }) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 })
    }

    const { id } = await params
    const { status } = (await request.json()) || {}

    // Whitelist: qualquer outro valor é recusado antes de tocar no banco.
    if (!ADMIN_ASSIGNABLE_STATUS.includes(status)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
    }

    await connectDB()

    /**
     * Atualização cirúrgica: o único campo que esta rota consegue escrever é
     * o `status`, com um valor que já passou pela whitelist. Nada do corpo da
     * requisição chega ao documento.
     *
     * O status anterior é lido antes da escrita, para o registro de
     * auditoria: "marcou como entregue" diz pouco; "tirou de aguardando
     * confirmação e marcou como entregue" diz o que aconteceu.
     */
    const before = await Order.findById(id).select('status').lean()
    if (!before) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
    }

    // Gravado no banco, não no console: quem mudou, o quê e de onde precisa
    // sobreviver ao próximo deploy para servir de conferência.
    await logAudit({
      action: 'order.status_changed',
      user: admin,
      order,
      ip: clientIp(request),
      detail: { from: before.status, to: status },
    })

    return NextResponse.json({ order: serializeAdminOrder(order) })
  } catch (err) {
    // Um id fora do formato do Mongo cai aqui como CastError.
    if (err?.name === 'CastError') {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
    }
    console.error('[admin:status:PATCH]', err)
    return NextResponse.json({ error: 'Não foi possível alterar o status.' }, { status: 500 })
  }
}
