import { SHOP } from '@/lib/shop'

/** Moldura das telas de login/cadastro/recuperação. */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <main className="auth">
      <div className="auth-card">
        <div className="auth-brand">
          <img className="auth-logo" src="/icons/icon-192.png" alt="" width={92} height={92} />
          <h1>{title || SHOP.name}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </main>
  )
}
