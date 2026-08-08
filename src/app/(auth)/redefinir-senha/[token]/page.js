import AuthShell from '@/components/AuthShell'
import ResetForm from '@/components/auth/ResetForm'

export const metadata = { title: 'Nova senha' }

export default async function ResetPage({ params }) {
  const { token } = await params

  return (
    <AuthShell title="Criar nova senha" subtitle="Escolha uma senha que você vá lembrar.">
      <ResetForm token={token} />
    </AuthShell>
  )
}
