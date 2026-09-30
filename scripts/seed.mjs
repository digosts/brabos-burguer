/**
 * Popula o banco com o cardápio da loja (os lanches do banner "Opções de
 * lanches"). As fotos ficam em `public/produtos/`.
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
    description: 'Hambúrguer artesanal de 160g no pão brioche',
    order: 1,
    products: [
      {
        name: 'Brabo Burguer',
        description:
          'Pão brioche, maionese defumada, hambúrguer artesanal de 160g, mussarela e cheddar.',
        price: 24,
        image: '/produtos/brabo-burguer.jpg',
        allowExtras: true,
      },
      {
        name: 'Brabo Salada',
        description:
          'Pão brioche, maionese defumada, cebola roxa, tomate, alface, hambúrguer artesanal de 160g, mussarela e cheddar.',
        price: 26,
        image: '/produtos/brabo-salada.jpg',
        allowExtras: true,
      },
      {
        name: 'Brabos Bacon',
        description:
          'Pão brioche, maionese defumada, hambúrguer artesanal de 160g, mussarela, cheddar e bacon.',
        price: 28,
        // Montada a partir da foto do Brabo Burguer, com o bacon do Salada Bacon.
        image: '/produtos/brabos-bacon.jpg',
        allowExtras: true,
      },
      {
        name: 'Brabo Salada Bacon',
        description:
          'Pão brioche, maionese defumada, cebola roxa, tomate, alface, hambúrguer artesanal de 160g, mussarela, cheddar e bacon.',
        price: 30,
        image: '/produtos/brabo-salada-bacon.jpg',
        allowExtras: true,
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
