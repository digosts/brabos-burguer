import Link from 'next/link'

export const metadata = { title: 'Página não encontrada' }

export default function NotFound() {
  return (
    <main className="auth">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-brand">
          <div className="empty-icon" style={{ margin: 0, fontSize: 30 }} aria-hidden>
            🍔
          </div>
          <h1>Página não encontrada</h1>
          <p>O link que você abriu não existe (ou saiu do menu).</p>
        </div>

        <Link className="btn btn-primary btn-block" href="/inicio">
          Voltar ao início
        </Link>
      </div>
    </main>
  )
}
