import AuthShell from '@/components/AuthShell'
import LoginForm from '@/components/auth/LoginForm'
import { SHOP } from '@/lib/shop'

export const metadata = { title: 'Entrar' }

export default function LoginPage() {
  return (
    <AuthShell title={SHOP.name} subtitle="Entre para pedir seu hambúrguer e acompanhar a entrega.">
      <LoginForm />
    </AuthShell>
  )
}
