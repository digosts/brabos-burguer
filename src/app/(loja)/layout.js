import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { ToastProvider } from '@/context/ToastContext'
import GuestShell from '@/components/GuestShell'

/**
 * Área aberta da loja — nenhuma tela daqui exige login. A raiz do site
 * cai aqui, no cardápio.
 *
 * O `AuthProvider` entra com usuário nulo de propósito: é isso que faz o
 * carrinho pedir nome e WhatsApp no fechamento do pedido. Quem já tem conta
 * é mandado para o app de sempre, para ninguém acabar com duas experiências
 * misturadas no mesmo aparelho.
 */
export default async function LojaLayout({ children }) {
  let hasAccount = false

  try {
    /**
     * Busca o usuário de verdade em vez de só conferir a assinatura do
     * cookie. Como `/inicio` manda de volta para cá quando não acha o
     * usuário, um cookie válido de uma conta apagada faria as duas telas
     * ficarem se empurrando para sempre. Consultando o banco, esse caso
     * simplesmente vira "visitante" e o cardápio abre.
     *
     * Não custa nada para o visitante comum: sem cookie, `getCurrentUser`
     * devolve null sem encostar no MongoDB.
     */
    hasAccount = Boolean(await getCurrentUser())
  } catch (err) {
    // Banco fora do ar: o cardápio ainda abre (ele avisa sozinho que não
    // conseguiu carregar o menu), o que é melhor que uma tela de erro.
    console.error('[loja layout]', err)
  }

  // Fora do try: `redirect` sinaliza lançando uma exceção interna do Next.
  if (hasAccount) redirect('/inicio')

  return (
    <AuthProvider initialUser={null}>
      <ToastProvider>
        <CartProvider>
          <GuestShell>{children}</GuestShell>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
