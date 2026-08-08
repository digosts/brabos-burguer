'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconAlert, IconEye, IconEyeOff, IconLock, IconMail } from '@/components/Icons'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Não foi possível entrar.')
        return
      }

      // `replace` para o botão voltar não retornar ao login.
      router.replace('/inicio')
    } catch {
      setError('Sem conexão com o servidor. Verifique sua internet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      {error ? (
        <div className="alert alert-error">
          <IconAlert size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <label className="field">
        <span className="field-label">
          <IconMail size={14} /> E-mail
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

      <label className="field">
        <span className="field-label">
          <IconLock size={14} /> Senha
        </span>
        <div className="input-group">
          <input
            className="input"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="input-affix"
            onClick={() => setShowPass((v) => !v)}
            aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPass ? <IconEyeOff size={18} /> : <IconEye size={18} />}
          </button>
        </div>
      </label>

      <div style={{ textAlign: 'right', marginBottom: 18 }}>
        <Link className="link" href="/recuperar-senha" style={{ fontSize: 13 }}>
          Esqueci minha senha
        </Link>
      </div>

      <button className="btn btn-primary btn-block" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" /> Entrando…
          </>
        ) : (
          'Entrar'
        )}
      </button>

      <p className="auth-foot">
        Não tem conta?{' '}
        <Link className="link" href="/cadastro">
          Criar agora
        </Link>
      </p>
    </form>
  )
}
