import { redirect } from 'next/navigation'
import { hasValidSession } from '@/lib/auth'

/**
 * Porta de entrada (é o start_url do PWA): manda para o app se já
 * houver sessão, senão para o login.
 */
export default async function RootPage() {
  redirect((await hasValidSession()) ? '/inicio' : '/login')
}
