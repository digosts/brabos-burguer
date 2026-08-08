import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'

/** Categorias ativas + produtos ativos, já agrupados para a tela inicial. */
export async function GET() {
  try {
    await connectDB()

    const [categories, products] = await Promise.all([
      Category.find({ active: { $ne: false } }).sort({ order: 1, name: 1 }).lean(),
      Product.find({ active: { $ne: false } }).sort({ order: 1, name: 1 }).lean(),
    ])

    const byCategory = new Map()
    for (const p of products) {
      const key = String(p.category)
      if (!byCategory.has(key)) byCategory.set(key, [])
      byCategory.get(key).push({
        id: String(p._id),
        name: p.name,
        description: p.description || '',
        price: p.price,
        oldPrice: p.oldPrice && p.oldPrice > p.price ? p.oldPrice : null,
        image: p.image || '',
        tag: p.tag || '',
      })
    }

    const result = categories
      .map((c) => ({
        id: String(c._id),
        name: c.name,
        description: c.description || '',
        icon: c.icon || '',
        products: byCategory.get(String(c._id)) || [],
      }))
      // Categoria sem produto cadastrado não aparece na tela.
      .filter((c) => c.products.length > 0)

    return NextResponse.json({ categories: result })
  } catch (err) {
    console.error('[catalog]', err)
    return NextResponse.json({ error: 'Não foi possível carregar o menu.' }, { status: 500 })
  }
}
