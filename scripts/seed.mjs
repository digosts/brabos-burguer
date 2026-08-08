/**
 * Popula o banco com um menu de exemplo — útil para ver o app funcionando
 * antes de cadastrar os produtos reais.
 *
 *   npm run seed            insere o que ainda não existe
 *   npm run seed -- --reset apaga categorias/produtos e insere de novo
 *
 * Depois disso você pode editar tudo direto no MongoDB Atlas
 * (Browse Collections) — o app lê do banco a cada carregamento.
 *
 * Este script NÃO mexe em usuários nem em pedidos.
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Lê .env.local sem depender de biblioteca (o Next carrega sozinho, o Node não). */
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const content = readFileSync(join(ROOT, file), 'utf8')
      for (const line of content.split(/\r?\n/)) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
        if (!match) continue
        const key = match[1]
        if (process.env[key]) continue
        let value = (match[2] || '').trim()
        // Remove as aspas em volta do valor, se houver.
        if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1)
        process.env[key] = value
      }
    } catch {
      /* arquivo ausente: segue para o próximo */
    }
  }
}

loadEnv()

const MENU = [
  {
    name: 'Lanches',
    icon: '🍔',
    description: 'Blend artesanal de 180g, feito na chapa',
    order: 1,
    products: [
      {
        name: 'X-Salada da Casa',
        description: 'Pão brioche, blend 180g, queijo prato, alface americana, tomate e cebola',
        price: 28.9,
        image:
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=70',
      },
      {
        name: 'X-Bacon Duplo',
        description: 'Dois blends de 180g, cheddar inglês, bacon crocante e maionese da casa',
        price: 36.9,
        tag: 'Mais pedido',
        image:
          'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=70',
      },
      {
        name: 'Duplo Cheddar',
        description: 'Dois blends de 180g, cheddar duplo, cebola caramelizada e molho especial',
        price: 41.9,
        oldPrice: 46.9,
        image:
          'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=600&q=70',
      },
    ],
  },
  {
    name: 'Acompanhamentos',
    icon: '🍟',
    description: 'Para dividir (ou não)',
    order: 2,
    products: [
      {
        name: 'Batata Frita Média',
        description: 'Porção individual de batata rústica com páprica e sal marinho',
        price: 14.9,
        image:
          'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=600&q=70',
      },
      {
        name: 'Batata Frita Grande',
        description: 'Batata rústica com páprica e sal marinho, serve duas pessoas',
        price: 18.9,
        image:
          'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=70',
      },
      {
        name: 'Onion Rings',
        description: 'Oito anéis de cebola empanados, com molho barbecue',
        price: 21.9,
        image:
          'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=600&q=70',
      },
    ],
  },
  {
    name: 'Bebidas',
    icon: '🥤',
    description: 'Tudo servido bem gelado',
    order: 3,
    products: [
      {
        name: 'Coca-Cola Lata 350ml',
        description: 'Lata gelada, servida com copo e gelo se você quiser',
        price: 7.5,
        image:
          'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=70',
      },
      {
        name: 'Fanta Laranja Lata 350ml',
        description: 'Refrigerante de laranja bem gelado',
        price: 7.5,
        image:
          'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=600&q=70',
      },
      {
        name: 'Schweppes Tônica Lata 350ml',
        description: 'Água tônica gelada, com gás',
        price: 8.5,
        image:
          'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=600&q=70',
      },
      {
        name: 'Suco Natural de Laranja 500ml',
        description: 'Espremido na hora, sem açúcar',
        price: 12.9,
        image:
          'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=70',
      },
    ],
  },
]

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri || uri.includes('usuario:senha')) {
    console.error(
      '\n✖ MONGODB_URI não configurada.\n' +
        '  Edite o arquivo .env.local com a string de conexão do seu MongoDB e rode de novo.\n'
    )
    process.exit(1)
  }

  const reset = process.argv.includes('--reset')

  console.log('→ Conectando ao MongoDB…')
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
  const db = mongoose.connection.db
  console.log(`✓ Conectado ao banco "${db.databaseName}"`)

  const categories = db.collection('categories')
  const products = db.collection('products')

  if (reset) {
    const c = await categories.deleteMany({})
    const p = await products.deleteMany({})
    console.log(`✓ Removidos ${c.deletedCount} categorias e ${p.deletedCount} produtos`)
  }

  let newCats = 0
  let newProds = 0

  for (const { products: list, ...cat } of MENU) {
    // upsert por nome: rodar o seed duas vezes não duplica nada.
    await categories.updateOne(
      { name: cat.name },
      { $set: { ...cat, active: true }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    )
    const catDoc = await categories.findOne({ name: cat.name })
    if (catDoc) newCats++

    for (const [i, product] of list.entries()) {
      const res = await products.updateOne(
        { name: product.name, category: catDoc._id },
        {
          $set: {
            ...product,
            oldPrice: product.oldPrice ?? null,
            tag: product.tag ?? '',
            category: catDoc._id,
            order: i + 1,
            active: true,
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      )
      if (res.upsertedCount) newProds++
    }
  }

  const totalCats = await categories.countDocuments()
  const totalProds = await products.countDocuments()

  console.log(`\n✓ Menu pronto: ${totalCats} categorias e ${totalProds} produtos no banco.`)
  if (newProds > 0) console.log(`  (${newProds} produtos novos inseridos agora)`)
  console.log('\nRode "npm run dev" e abra http://localhost:3000\n')

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error('\n✖ Falhou:', err.message)
  if (/ENOTFOUND|ETIMEOUT|timed out/i.test(err.message)) {
    console.error(
      '  Dica: no MongoDB Atlas, libere seu IP em Network Access → Add IP Address.\n'
    )
  }
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
