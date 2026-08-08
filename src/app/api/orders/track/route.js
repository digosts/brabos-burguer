import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import { ORDER_STATUS } from '@/lib/orderStatus'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_IDS = 20

/**
 * Andamento dos pedidos, sem login.
 *
 *   /api/orders/track?ids=<uuid>,<uuid>
 *
 * Quem pede sem conta guarda os `trackingId` no próprio navegador e consulta
 * todos de uma vez. O UUID é a credencial: só chega aqui quem fez o pedido
 * naquele aparelho, e adivinhar um não é viável.
 *
 * A resposta é de propósito enxuta — só o andamento. Os itens, o endereço e
 * o valor o app já tem guardados localmente, e não repeti-los aqui evita
 * expor o pedido inteiro a partir de um link que vaze.
 */
export async function GET(request) {
  try {
    const raw = new URL(request.url).searchParams.get('ids') || ''
    const ids = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => UUID.test(s))
      .slice(0, MAX_IDS)

    if (ids.length === 0) return NextResponse.json({ orders: [] })

    await connectDB()

    const orders = await Order.find({ trackingId: { $in: ids } })
      .select('trackingId code status updatedAt')
      .lean()

    return NextResponse.json({
      orders: orders.map((order) => {
        const status = ORDER_STATUS[order.status] || ORDER_STATUS.preparing
        return {
          trackingId: order.trackingId,
          code: order.code,
          status: order.status,
          statusLabel: status.label,
          statusTone: status.tone,
          statusStep: status.step,
          updatedAt: order.updatedAt,
        }
      }),
    })
  } catch (err) {
    console.error('[orders:track]', err)
    return NextResponse.json(
      { error: 'Não foi possível consultar o andamento.' },
      { status: 500 }
    )
  }
}
