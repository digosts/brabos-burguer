import { redirect } from 'next/navigation'
import { hasValidSession } from '@/lib/auth'

/** Quem já está logado não precisa ver login/cadastro. */
export default async function AuthLayout({ children }) {
  if (await hasValidSession()) redirect('/inicio')
  return children
}
