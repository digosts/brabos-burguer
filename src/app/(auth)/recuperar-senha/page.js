import AuthShell from '@/components/AuthShell'
import ForgotForm from '@/components/auth/ForgotForm'

export const metadata = { title: 'Recuperar senha' }

export default function ForgotPage() {
  return (
    <AuthShell title="Esqueceu a senha?" subtitle="Sem problema — vamos recuperar seu acesso.">
      <ForgotForm />
    </AuthShell>
  )
}
