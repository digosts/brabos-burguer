/**
 * Confere a saúde da coleção de usuários.
 *
 *   npm run check-users            só relata
 *   npm run check-users -- --fix   cria os índices únicos que faltarem
 *
 * O `--fix` só age se não houver duplicata: um índice único não pode ser
 * criado sobre dados que já se repetem, e o MongoDB recusa a operação.
 * Resolva as duplicatas apontadas no relatório e rode de novo.
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

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
        if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1)
        process.env[key] = value
      }
    } catch {
      /* arquivo ausente: segue para o próximo */
    }
  }
}

loadEnv()

const UNIQUE_FIELDS = ['email', 'phone']

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri || uri.includes('usuario:senha')) {
    console.error('\nx MONGODB_URI nao configurada no .env.local\n')
    process.exit(1)
  }

  const fix = process.argv.includes('--fix')

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
  const users = mongoose.connection.db.collection('users')

  console.log(`\n${await users.countDocuments()} usuario(s) na base\n`)

  let blocked = false

  for (const field of UNIQUE_FIELDS) {
    const dupes = await users
      .aggregate([
        { $group: { _id: `$${field}`, n: { $sum: 1 }, emails: { $push: '$email' } } },
        { $match: { n: { $gt: 1 } } },
      ])
      .toArray()

    if (dupes.length === 0) {
      console.log(`OK  ${field}: sem duplicatas`)
      continue
    }

    blocked = true
    console.log(`x   ${field}: ${dupes.length} valor(es) repetido(s)`)
    for (const d of dupes) {
      console.log(`      "${d._id}" usado por: ${d.emails.join(', ')}`)
    }
  }

  const indexes = await users.indexes()
  const uniqueOn = (field) =>
    indexes.some((ix) => ix.unique && Object.keys(ix.key).join() === field)

  console.log('')
  for (const field of UNIQUE_FIELDS) {
    console.log(`${uniqueOn(field) ? 'OK ' : 'x  '} indice unico em "${field}": ${uniqueOn(field)}`)
  }

  if (fix) {
    if (blocked) {
      console.log('\nx Nao da para criar os indices: resolva as duplicatas acima primeiro.\n')
    } else {
      for (const field of UNIQUE_FIELDS) {
        if (uniqueOn(field)) continue
        await users.createIndex({ [field]: 1 }, { unique: true })
        console.log(`\nOK indice unico criado em "${field}"`)
      }
      console.log('')
    }
  } else if (blocked || !UNIQUE_FIELDS.every(uniqueOn)) {
    console.log('\nRode "npm run check-users -- --fix" para criar os indices que faltam.\n')
  } else {
    console.log('\nTudo certo.\n')
  }

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error('\nx Falhou:', err.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
