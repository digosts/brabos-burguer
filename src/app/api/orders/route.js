import { NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { nextOrderCode } from '@/models/Counter'
import { getCurrentUser } from '@/lib/auth'
import { checkLimits, clientIp, MINUTE } from '@/lib/rateLimit'
import { logAuditThrottled } from '@/lib/audit'
import { OPEN_STATUS } from '@/lib/orderStatus'
import { SHOP } from '@/lib/shop'
import { serializeOrder } from '@/lib/serialize'
import { buildWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp'

const round2 = (n) => Math.round(n * 100) / 100

/** Itens *diferentes* por pedido. Um carrinho de verdade não chega perto disso. */
const MAX_ITEMS = 40

/** Teto do corpo da requisição. Um pedido cheio dá alguns poucos KB. */
const MAX_BODY_BYTES = 100 * 1024

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
    /**
     * Recusa o corpo gigante antes de lê-lo — `request.json()` carrega tudo
     * na memória, e um pedido de verdade não passa de alguns KB.
     *
     * É uma barreira barata, não uma garantia: o `content-length` vem de quem
     * chama e pode ser omitido (envio em chunks) ou mentir. Quem escapar aqui
     * ainda esbarra no limite de `items` logo abaixo — a diferença é que terá
     * custado uma leitura de corpo inteiro.
     */
    const declaredSize = Number(request.headers.get('content-length') || 0)
    if (declaredSize > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Pedido grande demais.' }, { status: 413 })
    }

    // Sem sessão o pedido não é recusado: a loja aceita quem entra direto
    // pelo cardápio. Nesse caso o contato vem do formulário do carrinho, e
    // é por isso que ele é validado aqui com o mesmo rigor do cadastro.
    const user = await getCurrentUser()

    const body = await request.json()
    const { items, paymentMethod, address, notes, changeFor, saveAddress = true } = body || {}

    let customerName = user?.name
    let customerPhone = user?.phone

    if (!user) {
      customerName = String(body?.customerName || '').trim().slice(0, 80)
      // Só dígitos, igual ao cadastro: é assim que o telefone é gravado no
      // banco, e é o formato que o link `tel:` do painel espera.
      customerPhone = String(body?.customerPhone || '').replace(/\D/g, '').slice(0, 13)

      if (customerName.length < 2) {
        return NextResponse.json(
          { error: 'Informe seu nome para a entrega.', fields: ['customerName'] },
          { status: 400 }
        )
      }
      if (customerPhone.length < 10) {
        return NextResponse.json(
          { error: 'Informe um WhatsApp com DDD.', fields: ['customerPhone'] },
          { status: 400 }
        )
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Seu carrinho está vazio.' }, { status: 400 })
    }

    // Teto no tamanho do carrinho. `qty` já era limitado a 99, mas a
    // quantidade de linhas não era: um POST com centenas de milhares de itens
    // percorria o laço inteiro, montava um `$in` gigante e tentava gravar um
    // documento perto do limite de 16 MB do Mongo. Route Handler não tem
    // limite de corpo por padrão, então a barreira precisa estar aqui.
    if (items.length > MAX_ITEMS) {
      return NextResponse.json(
        { error: `Seu carrinho passou de ${MAX_ITEMS} itens diferentes.` },
        { status: 400 }
      )
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

    /**
     * Freio do disparo em massa.
     *
     * As duas chaves se cobrem: sozinho, o limite por IP erra em prédio ou
     * rede móvel, onde vários clientes de verdade saem pelo mesmo endereço;
     * sozinho, o limite por telefone cai com um número novo a cada pedido.
     * Os valores são folgados de propósito — quem está pedindo jantar de
     * verdade não esbarra neles.
     */
    const limited = await checkLimits([
      { key: `order:phone:${customerPhone}`, limit: 2, windowMs: 10 * MINUTE },
      { key: `order:ip:${clientIp(request)}`, limit: 3, windowMs: 10 * MINUTE },
    ])
    if (!limited.ok) {
      await logAuditThrottled({
        throttleKey: `order_rl:${customerPhone}`,
        windowMs: 10 * MINUTE,
        action: 'order.rate_limited',
        user,
        ip: clientIp(request),
        detail: { customerPhone, customerName },
      })
      return NextResponse.json(
        { error: 'Você acabou de fazer um pedido. Aguarde alguns minutos para enviar outro.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
      )
    }

    await connectDB()

    /**
     * Um pedido em aberto por telefone.
     *
     * É a trava mais eficaz contra o trote: o limite por tempo só atrasa quem
     * insiste, mas isto impede que o mesmo número acumule pedidos na fila. E
     * é uma regra que o cliente honesto entende — ele ainda não recebeu o
     * anterior. Assim que a loja entrega ou cancela, o número libera.
     */
    const openOrder = await Order.findOne({
      customerPhone,
      status: { $in: OPEN_STATUS },
    }).select('code')

    if (openOrder) {
      return NextResponse.json(
        {
          error: `Você já tem o pedido #${openOrder.code} em andamento. Fale com a loja pelo WhatsApp para alterá-lo.`,
        },
        { status: 409 }
      )
    }

    // Buscamos os produtos no banco e recalculamos o total: o preço que
    // vale é o do MongoDB, nunca o que veio do navegador.
    //
    // O filtro por `isValidObjectId` não é cosmético: sem ele, um
    // `"productId": {"$ne": null}` entra no `$in` como objeto e a consulta
    // passa a depender de como o Mongoose faz o cast. Aqui só chega string
    // com formato de ObjectId.
    const ids = [...new Set(items.map((i) => String(i.productId)).filter(isValidObjectId))]
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Seu carrinho está vazio.' }, { status: 400 })
    }

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
      user: user?._id || null,
      customerName,
      customerPhone,
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
      /**
       * O pedido nasce aguardando confirmação, não em preparação.
       *
       * Antes, qualquer POST colocava a cozinha para trabalhar: o custo de um
       * trote era zero e o prejuízo, ingrediente de verdade. Agora existe um
       * humano entre o pedido e a chapa — a loja confere o WhatsApp e clica
       * em "Confirmar". Quem pediu vê "Recebido" e continua acompanhando.
       */
      status: 'awaiting_confirmation',
    })

    const message = buildWhatsAppMessage(order, SHOP.name, SHOP.pixKey)
    order.whatsappMessage = message
    await order.save()

    // Guarda o endereço no perfil para já vir preenchido no próximo pedido.
    // Quem pediu sem login não tem perfil: o endereço dele fica no
    // localStorage do próprio aparelho, gravado pelo carrinho.
    if (user && saveAddress) {
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
