import { IconAlert } from './Icons'

/**
 * Mostrado quando o servidor não consegue falar com o MongoDB —
 * na primeira execução isso quase sempre é o .env.local em branco.
 */
export default function SetupError({ message }) {
  return (
    <main className="auth">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-brand">
          <div className="empty-icon" style={{ color: 'var(--bad)', margin: 0 }}>
            <IconAlert size={34} />
          </div>
          <h1>Banco de dados não conectado</h1>
          <p>O app está no ar, mas não conseguiu falar com o MongoDB.</p>
        </div>

        <div className="steps">
          <div className="step">
            <span className="step-num">1</span>
            <div className="step-body">
              Copie <b>.env.example</b> para <b>.env.local</b> na raiz do projeto.
            </div>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <div className="step-body">
              Preencha <b>MONGODB_URI</b> com a string de conexão do seu cluster
              (MongoDB Atlas → Connect → Drivers) e <b>JWT_SECRET</b> com um texto
              aleatório longo.
            </div>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <div className="step-body">
              No Atlas, libere seu IP em <b>Network Access</b> e reinicie o
              servidor com <b>npm run dev</b>.
            </div>
          </div>
        </div>

        {message ? (
          <div className="alert alert-error" style={{ marginTop: 14, marginBottom: 0 }}>
            <IconAlert size={16} />
            <span style={{ wordBreak: 'break-word' }}>{message}</span>
          </div>
        ) : null}
      </div>
    </main>
  )
}
