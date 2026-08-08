/**
 * Define quem administra a loja.
 *
 *   npm run admin                      promove admin@admin.com.br
 *   npm run admin -- outro@email.com   promove outro e-mail
 *   npm run admin -- --list            mostra os admins atuais
 *   npm run admin -- --remove email    rebaixa alguém para cliente comum
 *
 * O papel de admin só pode ser concedido por aqui, com acesso direto ao
 * banco. Nenhuma rota da API grava este campo — não existe caminho pela
 * web para alguém se promover.
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_EMAIL = 'admin@admin.com.br'

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
        if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1)
        process.env[key] = value
      }
    } catch {
      /* arquivo ausente: segue para o próximo */
    }
  }
}

loadEnv()

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri || uri.includes('usuario:senha')) {
    console.error(
      '\nx MONGODB_URI nao configurada.\n' +
        '  Edite o .env.local com a string de conexao do seu MongoDB e rode de novo.\n'
    )
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const list = args.includes('--list')
  const removeIndex = args.indexOf('--remove')
  const remove = removeIndex !== -1

  const email = (args.find((a) => !a.startsWith('--')) || DEFAULT_EMAIL).trim().toLowerCase()

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
  const users = mongoose.connection.db.collection('users')

  if (list) {
    const admins = await users.find({ role: 'admin' }).toArray()
    if (admins.length === 0) {
      console.log('\nNenhum admin definido ainda. Rode "npm run admin" para criar o primeiro.\n')
    } else {
      console.log(`\n${admins.length} admin(s):`)
      for (const a of admins) console.log(`  - ${a.name} <${a.email}>`)
      console.log('')
    }
    await mongoose.disconnect()
    return
  }

  const user = await users.findOne({ email })
  if (!user) {
    console.error(
      `\nx Nenhum usuario com o e-mail "${email}".\n` +
        '  Cadastre a conta pelo app primeiro, depois rode este script.\n'
    )
    await mongoose.disconnect()
    process.exit(1)
  }

  const role = remove ? 'customer' : 'admin'
  await users.updateOne({ _id: user._id }, { $set: { role } })

  console.log(
    remove
      ? `\nOK ${user.name} <${email}> agora e um cliente comum.\n`
      : `\nOK ${user.name} <${email}> agora e ADMIN.\n` +
          '  Nao precisa sair da conta: o papel e lido do banco a cada requisicao.\n' +
          '  Basta recarregar a pagina. Se o "npm run dev" ja estava rodando\n' +
          '  antes do campo "role" existir, reinicie-o primeiro.\n'
  )

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error('\nx Falhou:', err.message)
  if (/ENOTFOUND|ETIMEOUT|timed out/i.test(err.message)) {
    console.error('  Dica: no MongoDB Atlas, libere seu IP em Network Access -> Add IP Address.\n')
  }
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
