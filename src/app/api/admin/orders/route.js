import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import { getCurrentAdmin } from '@/lib/auth'
import { CLOSED_STATUS, OPEN_STATUS } from '@/lib/orderStatus'
import { serializeAdminOrder } from '@/lib/serialize'

/**
 * Lista os pedidos da loja inteira. Exclusiva do admin.
 *
 *   ?scope=active     tudo que ainda não foi entregue (fila de trabalho)
 *   ?scope=delivered  os já entregues (conferência)
 */
export async function GET(request) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      // Mesma resposta para "não logado" e "logado sem permissão": quem não
      // é admin não descobre nem que a rota existe.
      return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 })
    }

    const scope = new URL(request.url).searchParams.get('scope') === 'delivered'
      ? 'delivered'
      : 'active'

    await connectDB()

    // Um pedido cancelado sai da fila mas não some: fica na aba de
    // conferência, que é onde você confere um trote depois de recusá-lo.
    const filter =
      scope === 'delivered'
        ? { status: { $in: CLOSED_STATUS } }
        : { status: { $in: OPEN_STATUS } }

    // A fila de trabalho vai do mais antigo para o mais novo: o pedido que
    // está esperando há mais tempo aparece primeiro. Já a conferência mostra
    // as entregas mais recentes no topo.
    const sort = scope === 'delivered' ? { updatedAt: -1 } : { createdAt: 1 }

    const orders = await Order.find(filter).sort(sort).limit(200)

    return NextResponse.json({ scope, orders: orders.map(serializeAdminOrder) })
  } catch (err) {
    console.error('[admin:orders:GET]', err)
    return NextResponse.json({ error: 'Não foi possível carregar os pedidos.' }, { status: 500 })
  }
}
