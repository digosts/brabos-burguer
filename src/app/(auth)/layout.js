import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { homePathFor } from '@/lib/home'

/** Quem já está logado não precisa ver login/cadastro. */
export default async function AuthLayout({ children }) {
  let user = null

  try {
    user = await getCurrentUser()
  } catch (err) {
    // Banco fora do ar não pode derrubar a tela de login — ela é justamente
    // onde alguém vai parar quando o resto falha. Na dúvida, mostra o
    // formulário: o pior caso é pedir a senha a quem já estava dentro.
    console.error('[auth layout]', err)
  }

  // Fora do try: `redirect` sinaliza lançando uma exceção interna do Next,
  // que não pode ser engolida pelo catch acima.
  if (user) redirect(homePathFor(user))

  return children
}
