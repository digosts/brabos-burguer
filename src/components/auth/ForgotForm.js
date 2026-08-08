'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconAlert, IconCheckCircle, IconInfo, IconMail } from '@/components/Icons'

export default function ForgotForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [devUrl, setDevUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Não foi possível enviar as instruções.')
        return
      }

      setSent(true)
      // Em desenvolvimento (sem SMTP) a API devolve o link direto.
      if (data.devResetUrl) setDevUrl(data.devResetUrl)
    } catch {
      setError('Sem conexão com o servidor. Verifique sua internet.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div>
        <div className="alert alert-ok">
          <IconCheckCircle size={16} />
          <span>
            Se <b>{email}</b> estiver cadastrado, enviamos um link para criar uma
            nova senha. O link vale por 30 minutos.
          </span>
        </div>

        {devUrl ? (
          <div className="alert alert-info" style={{ flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <IconInfo size={16} />
              <span>
                <b>Modo de desenvolvimento:</b> nenhum servidor de e-mail está
                configurado, então o link aparece aqui.
              </span>
            </div>
            <Link className="btn btn-ghost btn-sm btn-block" href={devUrl.replace(location.origin, '')}>
              Abrir link de redefinição
            </Link>
          </div>
        ) : null}

        <Link className="btn btn-primary btn-block" href="/login" style={{ marginTop: 8 }}>
          Voltar para o login
        </Link>

        <p className="auth-foot">
          Não recebeu?{' '}
          <button className="link" onClick={() => setSent(false)}>
            Tentar outro e-mail
          </button>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      {error ? (
        <div className="alert alert-error">
          <IconAlert size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <p style={{ fontSize: 13.5, color: 'var(--text-dim)', marginBottom: 18, lineHeight: 1.55 }}>
        Informe o e-mail da sua conta. Enviaremos um link para você criar uma
        senha nova.
      </p>

      <label className="field">
        <span className="field-label">
          <IconMail size={14} /> E-mail cadastrado
        </span>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          autoComplete="email"
          inputMode="email"
          required
        />
      </label>

      <button className="btn btn-primary btn-block" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" /> Enviando…
          </>
        ) : (
          'Enviar link de recuperação'
        )}
      </button>

      <p className="auth-foot">
        <Link className="link" href="/login">
          Voltar para o login
        </Link>
      </p>
    </form>
  )
}
