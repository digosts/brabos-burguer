import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Order from '@/models/Order'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { ToastProvider } from '@/context/ToastContext'
import AppShell from '@/components/AppShell'
import SetupError from '@/components/SetupError'

/** Todas as telas internas passam por aqui: exigem login. */
export default async function AppLayout({ children }) {
  let user = null
  let activeOrders = 0
  let dbError = null

  try {
    const doc = await getCurrentUser()
    if (doc) {
      user = doc.toPublic()
      // Badge do menu: pedidos que ainda não foram entregues.
      activeOrders = await Order.countDocuments({
        user: doc._id,
        status: { $in: ['preparing', 'on_the_way'] },
      })
    }
  } catch (err) {
    console.error('[app layout]', err)
    dbError = err.message
  }

  if (dbError) return <SetupError message={dbError} />

  // Fora do try: `redirect` funciona lançando uma exceção interna do Next,
  // que não pode ser engolida pelo catch acima.
  if (!user) redirect('/login')

  return (
    <AuthProvider initialUser={user}>
      <ToastProvider>
        <CartProvider>
          <AppShell ordersBadge={activeOrders}>{children}</AppShell>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
