'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PAYMENT_LABEL } from '@/lib/orderStatus'
import { brl, formatPhone, formatTime } from '@/lib/format'
import { filterOrdersByDay, groupOrdersByDay } from '@/lib/orderDays'
import { useToast } from '@/context/ToastContext'
import DayFilter from './DayFilter'
import {
  IconAlert,
  IconCalendar,
  IconCard,
  IconCheck,
  IconCheckCircle,
  IconMapPin,
  IconNote,
  IconPhone,
  IconTruck,
} from './Icons'

const TABS = [
  { href: '/admin/pedidos', label: 'Em andamento' },
  { href: '/admin/entregues', label: 'Entregues' },
]

const COPY = {
  active: {
    title: 'Pedidos da loja',
    empty: 'Nenhum pedido em aberto',
    emptyHint: 'Assim que chegar um pedido novo, ele aparece aqui.',
    countLabel: (n) => `${n} ${n === 1 ? 'pedido em aberto' : 'pedidos em aberto'} · mais antigos primeiro`,
  },
  delivered: {
    title: 'Entregues',
    empty: 'Nenhuma entrega concluída ainda',
    emptyHint: 'Os pedidos marcados como entregues ficam aqui para conferência.',
    countLabel: (n) => `${n} ${n === 1 ? 'pedido entregue' : 'pedidos entregues'} · mais recentes primeiro`,
  },
}

export default function AdminOrdersView({ scope }) {
  const toast = useToast()
  const pathname = usePathname()
  const copy = COPY[scope]

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(null)
  const [day, setDay] = useState('')

  // O dia é sempre o da abertura do pedido, nas duas abas: é assim que a loja
  // fecha o caixa do dia e é o mesmo dia que o cliente vê na tela dele.
  const visible = useMemo(() => filterOrdersByDay(orders, day), [orders, day])
  const groups = useMemo(() => groupOrdersByDay(visible), [visible])

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders?scope=${scope}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Não foi possível carregar os pedidos.')
        return
      }
      setOrders(data.orders || [])
      setError('')
    } catch {
      setError('Sem conexão. Não conseguimos atualizar a lista.')
    } finally {
      setLoading(false)
    }
  }, [scope])

  useEffect(() => {
    load()

    // Pedidos novos chegam enquanto a tela está aberta.
    const tick = () => {
      if (document.visibilityState === 'visible') load()
    }
    const id = setInterval(tick, 30000)
    document.addEventListener('visibilitychange', tick)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [load])

  const changeStatus = async (orderId, status, successMsg) => {
    setSaving(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast(data.error || 'Não foi possível alterar o status.', 'error')
        return
      }

      toast(successMsg, 'ok')

      // O pedido pode ter saído do escopo desta tela (ex.: virou "entregue"
      // na fila). Recarregar mantém as duas listas coerentes.
      load()
    } catch {
      toast('Sem conexão. O status não foi alterado.', 'error')
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      <h1 className="page-title">{copy.title}</h1>
      <p className="page-sub">{loading ? 'Carregando…' : copy.countLabel(orders.length)}</p>

      <nav className="admin-tabs" aria-label="Listas de pedidos">
        {TABS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`admin-tab${pathname === href ? ' active' : ''}`}
            aria-current={pathname === href ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>

      {error ? (
        <div className="alert alert-error">
          <IconAlert size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        Array.from({ length: 2 }).map((_, i) => (
          <div className="order-card" key={i}>
            <div className="skeleton" style={{ height: 18, width: '45%', marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 60 }} />
          </div>
        ))
      ) : null}

      {!loading && orders.length > 0 ? (
        <DayFilter value={day} onChange={setDay} count={visible.length} />
      ) : null}

      {!loading && orders.length === 0 && !error ? (
        <div className="empty">
          <div className="empty-icon" aria-hidden>
            <IconCheckCircle size={34} />
          </div>
          <strong>{copy.empty}</strong>
          <p>{copy.emptyHint}</p>
        </div>
      ) : null}

      {!loading && orders.length > 0 && visible.length === 0 ? (
        <div className="empty">
          <div className="empty-icon" aria-hidden>
            <IconCalendar size={34} />
          </div>
          <strong>Nenhum pedido nesta data</strong>
          <p>Escolha outro dia ou volte para a lista completa.</p>
          <button className="btn btn-ghost" onClick={() => setDay('')}>
            Ver todos
          </button>
        </div>
      ) : null}

      {groups.map((group) => (
        <section className="day-group" key={group.key}>
          <header className="day-head">
            <h2 className="day-title">{group.label}</h2>
            <span className="day-sum">
              {group.orders.length} {group.orders.length === 1 ? 'pedido' : 'pedidos'} ·{' '}
              {brl(group.total)}
            </span>
          </header>

          {group.orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-head">
                <div>
                  <div className="order-code">Pedido #{order.code}</div>
                  <div className="order-date">{formatTime(order.createdAt)}</div>
                </div>
                <span className={`status ${order.statusTone}`}>
                  <span className="dot" />
                  {order.statusLabel}
                </span>
              </div>

              <div className="admin-customer">
                <strong>{order.customerName}</strong>
                {order.isGuest ? (
                  <span className="guest-tag" title="Pedido feito sem cadastro">
                    Sem conta
                  </span>
                ) : null}
                <a className="admin-phone" href={`tel:+${order.customerPhone}`}>
                  <IconPhone size={13} />
                  {formatPhone(order.customerPhone)}
                </a>
              </div>

              <div className="order-items">
                {order.items.map((item, i) => (
                  <div className="order-item" key={i}>
                    <span className="qty">{item.qty}x</span>
                    <span className="name">
                      {item.name}
                      {item.notes ? (
                        <em style={{ display: 'block', fontSize: 12, color: 'var(--warn)' }}>
                          {item.notes}
                        </em>
                      ) : null}
                    </span>
                    <span className="val">{brl(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="order-meta">
                <div>
                  <IconMapPin size={14} />
                  <span>
                    {order.address.street}, {order.address.number} - {order.address.neighborhood}
                    {order.address.complement ? ` (${order.address.complement})` : ''}
                    {order.address.reference ? ` · Ref: ${order.address.reference}` : ''}
                  </span>
                </div>
                <div>
                  <IconCard size={14} />
                  <span>
                    {PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}
                    {order.changeFor ? ` · troco para ${brl(order.changeFor)}` : ''}
                  </span>
                </div>
                {order.notes ? (
                  <div>
                    <IconNote size={14} />
                    <span>{order.notes}</span>
                  </div>
                ) : null}
              </div>

              <div className="order-foot">
                <div className="order-total">
                  {brl(order.total)}
                  <small>
                    {order.deliveryFee > 0
                      ? `inclui ${brl(order.deliveryFee)} de entrega`
                      : 'entrega grátis'}
                  </small>
                </div>

                <div className="admin-actions">
                  {order.status !== 'on_the_way' ? (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        changeStatus(
                          order.id,
                          'on_the_way',
                          `Pedido #${order.code} saiu para entrega`
                        )
                      }
                      disabled={saving === order.id}
                    >
                      {saving === order.id ? <span className="spinner" /> : <IconTruck size={15} />}
                      {order.status === 'delivered' ? 'Voltar para rota' : 'Saiu para entrega'}
                    </button>
                  ) : null}

                  {order.status !== 'delivered' ? (
                    <button
                      className="btn btn-ok btn-sm"
                      onClick={() =>
                        changeStatus(
                          order.id,
                          'delivered',
                          `Pedido #${order.code} marcado como entregue`
                        )
                      }
                      disabled={saving === order.id}
                    >
                      {saving === order.id ? <span className="spinner" /> : <IconCheck size={15} />}
                      Entregue
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      ))}
    </>
  )
}
