import { notFound } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth'

/**
 * Barreira da área administrativa inteira.
 *
 * Toda página abaixo de /admin herda esta verificação — não dá para criar
 * uma tela nova aqui e esquecer de protegê-la. Devolvemos 404 em vez de 403
 * para que um cliente comum sequer descubra que a área existe.
 *
 * Isto protege a navegação. Os dados são protegidos separadamente, nas
 * rotas de API, que refazem a mesma verificação por conta própria.
 */
export default async function AdminLayout({ children }) {
  const admin = await getCurrentAdmin()
  if (!admin) notFound()

  return children
}
