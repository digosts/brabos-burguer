'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { maskPhone, isValidEmail } from '@/lib/format'
import { IconAlert, IconEye, IconEyeOff, IconLock, IconMail, IconPhone, IconUser } from '@/components/Icons'

export default function RegisterForm() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => {
    const value = key === 'phone' ? maskPhone(e.target.value) : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const errs = {}
    if (form.name.trim().length < 2) errs.name = 'Informe seu nome'
    if (!isValidEmail(form.email)) errs.email = 'E-mail inválido'
    if (form.phone.replace(/\D/g, '').length < 10) errs.phone = 'Informe DDD + número'
    if (form.password.length < 6) errs.password = 'Mínimo de 6 caracteres'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Não foi possível criar a conta.')
        // A API diz qual campo colidiu ("email" ou "phone") — marcamos o
        // input para o usuário não ter que caçar o problema no formulário.
        if (data.field) setFieldErrors((prev) => ({ ...prev, [data.field]: data.error }))
        return
      }

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
          <IconUser size={14} /> Nome completo
        </span>
        <input
          className="input"
          value={form.name}
          onChange={set('name')}
          placeholder="Como devemos te chamar"
          autoComplete="name"
          aria-invalid={Boolean(fieldErrors.name)}
        />
        {fieldErrors.name ? <span className="field-error">{fieldErrors.name}</span> : null}
      </label>

      <label className="field">
        <span className="field-label">
          <IconMail size={14} /> E-mail
        </span>
        <input
          className="input"
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="voce@email.com"
          autoComplete="email"
          inputMode="email"
          aria-invalid={Boolean(fieldErrors.email)}
        />
        {fieldErrors.email ? <span className="field-error">{fieldErrors.email}</span> : null}
      </label>

      <label className="field">
        <span className="field-label">
          <IconPhone size={14} /> WhatsApp
        </span>
        <input
          className="input"
          value={form.phone}
          onChange={set('phone')}
          placeholder="(11) 98888-7777"
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={Boolean(fieldErrors.phone)}
        />
        {fieldErrors.phone ? (
          <span className="field-error">{fieldErrors.phone}</span>
        ) : (
          <span className="field-hint">Usamos para confirmar a entrega.</span>
        )}
      </label>

      <label className="field">
        <span className="field-label">
          <IconLock size={14} /> Senha
        </span>
        <div className="input-group">
          <input
            className="input"
            type={showPass ? 'text' : 'password'}
            value={form.password}
            onChange={set('password')}
            placeholder="Mínimo de 6 caracteres"
            autoComplete="new-password"
            aria-invalid={Boolean(fieldErrors.password)}
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
        {fieldErrors.password ? <span className="field-error">{fieldErrors.password}</span> : null}
      </label>

      <button className="btn btn-primary btn-block" style={{ marginTop: 6 }} disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" /> Criando conta…
          </>
        ) : (
          'Criar minha conta'
        )}
      </button>

      <p className="auth-foot">
        Já tem conta?{' '}
        <Link className="link" href="/login">
          Entrar
        </Link>
      </p>
    </form>
  )
}
