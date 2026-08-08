'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconAlert, IconEye, IconEyeOff, IconLock } from '@/components/Icons'

export default function ResetForm({ token }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha precisa ter no mínimo 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Não foi possível redefinir a senha.')
        return
      }

      // A API já devolve o cookie de sessão: entra direto no app.
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
          <IconLock size={14} /> Nova senha
        </span>
        <div className="input-group">
          <input
            className="input"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo de 6 caracteres"
            autoComplete="new-password"
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

      <label className="field">
        <span className="field-label">
          <IconLock size={14} /> Repetir a nova senha
        </span>
        <input
          className="input"
          type={showPass ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Digite novamente"
          autoComplete="new-password"
        />
      </label>

      <button className="btn btn-primary btn-block" style={{ marginTop: 6 }} disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" /> Salvando…
          </>
        ) : (
          'Salvar nova senha'
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
