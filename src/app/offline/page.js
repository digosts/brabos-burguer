import { SHOP } from '@/lib/shop'

export const metadata = { title: 'Sem conexão' }

/** Página servida pelo service worker quando não há internet. */
export default function OfflinePage() {
  return (
    <main className="auth">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-brand">
          <img className="auth-logo" src="/icons/icon-192.png" alt="" width={68} height={68} />
          <h1>Você está sem conexão</h1>
          <p>
            O {SHOP.name} precisa de internet para carregar o menu e enviar
            pedidos. Reconecte e tente de novo.
          </p>
        </div>

        <a className="btn btn-primary btn-block" href="/inicio">
          Tentar novamente
        </a>
      </div>
    </main>
  )
}
