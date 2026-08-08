'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useInstall } from '@/context/InstallContext'
import { brl, formatPhone, maskPhone } from '@/lib/format'
import {
  IconCheckCircle,
  IconDownload,
  IconEdit,
  IconLock,
  IconLogout,
  IconMail,
  IconMapPin,
  IconPhone,
  IconUser,
} from './Icons'

const EMPTY_ADDRESS = { street: '', number: '', neighborhood: '', complement: '', reference: '' }

export default function ProfileView() {
  const { user, setUser, logout } = useAuth()
  const { installed, promptInstall } = useInstall()
  const toast = useToast()

  const [form, setForm] = useState({ name: '', phone: '', address: EMPTY_ADDRESS })
  const [pass, setPass] = useState({ currentPassword: '', newPassword: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPass, setSavingPass] = useState(false)
  const [stats, setStats] = useState({ total: 0, active: 0, spent: 0 })

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name || '',
      phone: formatPhone(user.phone),
      address: { ...EMPTY_ADDRESS, ...user.address },
    })
  }, [user])

  useEffect(() => {
    fetch('/api/orders', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then(({ orders = [] }) =>
        setStats({
          total: orders.length,
          active: orders.filter((o) => ['preparing', 'on_the_way'].includes(o.status)).length,
          spent: orders
            .filter((o) => o.status !== 'canceled')
            .reduce((sum, o) => sum + o.total, 0),
        })
      )
      .catch(() => {
        /* offline: mantém os zeros */
      })
  }, [])

  const setAddr = (key) => (e) =>
    setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: e.target.value } }))

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone.replace(/\D/g, ''),
          address: form.address,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast(data.error || 'Não foi possível salvar.', 'error')
        return
      }

      setUser(data.user)
      toast('Dados atualizados!', 'ok')
    } catch {
      toast('Sem conexão. Tente novamente.', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setSavingPass(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pass),
      })
      const data = await res.json()

      if (!res.ok) {
        toast(data.error || 'Não foi possível trocar a senha.', 'error')
        return
      }

      setPass({ currentPassword: '', newPassword: '' })
      toast('Senha alterada!', 'ok')
    } catch {
      toast('Sem conexão. Tente novamente.', 'error')
    } finally {
      setSavingPass(false)
    }
  }

  const initials = (user?.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

  return (
    <>
      <h1 className="page-title">Perfil</h1>
      <p className="page-sub">Seus dados e endereço de entrega</p>

      <div className="profile-hero">
        <div className="avatar" aria-hidden>
          {initials}
        </div>
        <div className="profile-hero-body">
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
          <span>{formatPhone(user?.phone)}</span>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <strong>{stats.total}</strong>
          <span>pedidos</span>
        </div>
        <div className="stat">
          <strong>{stats.active}</strong>
          <span>em andamento</span>
        </div>
        <div className="stat">
          <strong style={{ fontSize: 16 }}>{brl(stats.spent)}</strong>
          <span>total gasto</span>
        </div>
      </div>

      {/* Instalação do app — só aparece se ainda não estiver instalado. */}
      {!installed ? (
        <div className="block" style={{ marginTop: 12 }}>
          <div className="block-head">
            <IconDownload size={17} /> Instalar o aplicativo
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.5 }}>
            Tenha o app na tela inicial do celular ou na área de trabalho do
            computador: abre em tela cheia, carrega mais rápido e funciona até
            sem internet.
          </p>
          <button className="btn btn-primary btn-block" onClick={promptInstall}>
            <IconDownload size={18} /> Instalar agora
          </button>
        </div>
      ) : (
        <div className="alert alert-ok" style={{ marginTop: 12 }}>
          <IconCheckCircle size={16} />
          <span>App instalado neste dispositivo. Aproveite!</span>
        </div>
      )}

      {/* ── dados pessoais + endereço ─────────────────────── */}
      <form className="block" onSubmit={saveProfile}>
        <div className="block-head">
          <IconEdit size={17} /> Meus dados
        </div>

        <label className="field">
          <span className="field-label">
            <IconUser size={14} /> Nome
          </span>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            autoComplete="name"
          />
        </label>

        <label className="field">
          <span className="field-label">
            <IconPhone size={14} /> WhatsApp
          </span>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: maskPhone(e.target.value) }))}
            autoComplete="tel"
            inputMode="tel"
          />
        </label>

        <label className="field">
          <span className="field-label">
            <IconMail size={14} /> E-mail
          </span>
          <input className="input" value={user?.email || ''} disabled />
          <span className="field-hint">O e-mail é o seu login e não pode ser alterado.</span>
        </label>

        <div className="divider" />

        <div className="block-head">
          <IconMapPin size={17} /> Endereço de entrega
        </div>

        <div className="row row-street">
          <label className="field" style={{ margin: 0 }}>
            <span className="field-label">Rua</span>
            <input
              className="input"
              value={form.address.street}
              onChange={setAddr('street')}
              placeholder="Rua das Flores"
              autoComplete="address-line1"
            />
          </label>
          <label className="field" style={{ margin: 0 }}>
            <span className="field-label">Número</span>
            <input
              className="input"
              value={form.address.number}
              onChange={setAddr('number')}
              placeholder="123"
              inputMode="numeric"
            />
          </label>
        </div>

        <label className="field" style={{ marginTop: 12 }}>
          <span className="field-label">Bairro</span>
          <input
            className="input"
            value={form.address.neighborhood}
            onChange={setAddr('neighborhood')}
            placeholder="Centro"
          />
        </label>

        <div className="row row-2">
          <label className="field" style={{ margin: 0 }}>
            <span className="field-label">Complemento</span>
            <input
              className="input"
              value={form.address.complement}
              onChange={setAddr('complement')}
              placeholder="Apto 42"
            />
          </label>
          <label className="field" style={{ margin: 0 }}>
            <span className="field-label">Referência</span>
            <input
              className="input"
              value={form.address.reference}
              onChange={setAddr('reference')}
              placeholder="Portão azul"
            />
          </label>
        </div>

        <span className="field-hint" style={{ marginBottom: 14, display: 'block' }}>
          Este endereço já vem preenchido no checkout — você pode alterar a
          qualquer momento.
        </span>

        <button className="btn btn-primary btn-block" disabled={savingProfile}>
          {savingProfile ? (
            <>
              <span className="spinner" /> Salvando…
            </>
          ) : (
            'Salvar alterações'
          )}
        </button>
      </form>

      {/* ── troca de senha ────────────────────────────────── */}
      <form className="block" onSubmit={savePassword}>
        <div className="block-head">
          <IconLock size={17} /> Alterar senha
        </div>

        <label className="field">
          <span className="field-label">Senha atual</span>
          <input
            className="input"
            type="password"
            value={pass.currentPassword}
            onChange={(e) => setPass((p) => ({ ...p, currentPassword: e.target.value }))}
            autoComplete="current-password"
          />
        </label>

        <label className="field">
          <span className="field-label">Nova senha</span>
          <input
            className="input"
            type="password"
            value={pass.newPassword}
            onChange={(e) => setPass((p) => ({ ...p, newPassword: e.target.value }))}
            placeholder="Mínimo de 6 caracteres"
            autoComplete="new-password"
          />
        </label>

        <button
          className="btn btn-ghost btn-block"
          disabled={savingPass || !pass.currentPassword || !pass.newPassword}
        >
          {savingPass ? (
            <>
              <span className="spinner" /> Alterando…
            </>
          ) : (
            'Alterar senha'
          )}
        </button>
      </form>

      <button className="btn btn-danger btn-block" style={{ marginTop: 20 }} onClick={logout}>
        <IconLogout size={18} /> Sair da conta
      </button>
    </>
  )
}
