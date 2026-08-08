import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { nextOrderCode } from '@/models/Counter'
import { getCurrentUser } from '@/lib/auth'
import { SHOP } from '@/lib/shop'
import { serializeOrder } from '@/lib/serialize'
import { buildWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp'

const round2 = (n) => Math.round(n * 100) / 100

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    await connectDB()
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(100)

    return NextResponse.json({ orders: orders.map(serializeOrder) })
  } catch (err) {
    console.error('[orders:GET]', err)
    return NextResponse.json({ error: 'Não foi possível carregar seus pedidos.' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await request.json()
    const { items, paymentMethod, address, notes, changeFor, saveAddress = true } = body || {}

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Seu carrinho está vazio.' }, { status: 400 })
    }
    if (!['pix', 'credit', 'debit'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Escolha a forma de pagamento.' }, { status: 400 })
    }

    // Endereço: os três campos que você exigiu são obrigatórios aqui também,
    // não só no formulário — a API não confia no cliente.
    const street = address?.street?.trim()
    const number = address?.number?.trim()
    const neighborhood = address?.neighborhood?.trim()

    const missing = []
    if (!street) missing.push('rua')
    if (!number) missing.push('número')
    if (!neighborhood) missing.push('bairro')
    if (missing.length) {
      return NextResponse.json(
        { error: `Informe ${missing.join(', ')} para a entrega.`, fields: missing },
        { status: 400 }
      )
    }

    await connectDB()

    // Buscamos os produtos no banco e recalculamos o total: o preço que
    // vale é o do MongoDB, nunca o que veio do navegador.
    const ids = [...new Set(items.map((i) => i.productId))]
    const products = await Product.find({ _id: { $in: ids }, active: { $ne: false } }).lean()
    const productById = new Map(products.map((p) => [String(p._id), p]))

    const orderItems = []
    for (const item of items) {
      const product = productById.get(String(item.productId))
      if (!product) {
        return NextResponse.json(
          { error: `O item "${item.name || 'selecionado'}" saiu do menu. Remova-o do carrinho.` },
          { status: 409 }
        )
      }
      const qty = Math.max(1, Math.min(99, Math.floor(Number(item.qty) || 1)))
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        qty,
        notes: String(item.notes || '').trim().slice(0, 200),
      })
    }

    const subtotal = round2(orderItems.reduce((sum, i) => sum + i.price * i.qty, 0))

    if (SHOP.minOrder > 0 && subtotal < SHOP.minOrder) {
      return NextResponse.json(
        { error: `O pedido mínimo é de R$ ${SHOP.minOrder.toFixed(2).replace('.', ',')}.` },
        { status: 400 }
      )
    }

    const deliveryFee = round2(SHOP.deliveryFee)
    const total = round2(subtotal + deliveryFee)

    const parsedChange = Number(changeFor)
    const order = await Order.create({
      code: await nextOrderCode(),
      user: user._id,
      customerName: user.name,
      customerPhone: user.phone,
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      changeFor:
        paymentMethod === 'pix' && Number.isFinite(parsedChange) && parsedChange > total
          ? round2(parsedChange)
          : null,
      address: {
        street,
        number,
        neighborhood,
        complement: address?.complement?.trim() || '',
        reference: address?.reference?.trim() || '',
      },
      notes: String(notes || '').trim().slice(0, 500),
      status: 'preparing',
    })

    const message = buildWhatsAppMessage(order, SHOP.name)
    order.whatsappMessage = message
    await order.save()

    // Guarda o endereço no perfil para já vir preenchido no próximo pedido.
    if (saveAddress) {
      user.address = order.address
      await user.save()
    }

    return NextResponse.json(
      {
        order: serializeOrder(order),
        whatsappUrl: SHOP.whatsapp ? buildWhatsAppUrl(SHOP.whatsapp, message) : null,
        whatsappMessage: message,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[orders:POST]', err)
    return NextResponse.json({ error: 'Não foi possível enviar seu pedido.' }, { status: 500 })
  }
}
