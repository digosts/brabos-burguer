'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { PAYMENT_LABEL } from '@/lib/orderStatus'
import { brl, formatTime } from '@/lib/format'
import { filterOrdersByDay, groupOrdersByDay } from '@/lib/orderDays'
import { useToast } from '@/context/ToastContext'
import DayFilter from './DayFilter'
import OrderTrack from './OrderTrack'
import {
  IconAlert,
  IconCard,
  IconClock,
  IconMapPin,
  IconNote,
  IconRefresh,
  IconWhatsApp,
} from './Icons'

/**
 * O "Reenviar" existe para quem fechou o app antes de mandar a mensagem no
 * WhatsApp. A partir do momento em que a loja move o pedido para a rota, ela
 * claramente já recebeu — reenviar ali só confunde o cliente.
 */
const HIDE_RESEND_STATUS = ['on_the_way', 'delivered']

/**
 * Pedido encerrado não muda mais de status: buscar de novo só devolveria a
 * mesma coisa, então o botão de atualizar não aparece nesses cards.
 */
const FINAL_STATUS = ['delivered', 'canceled']

export default function OrdersView() {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [day, setDay] = useState('')

  const visible = useMemo(() => filterOrdersByDay(orders, day), [orders, day])
  const groups = useMemo(() => groupOrdersByDay(visible), [visible])

  /** Devolve `true` quando a lista veio do servidor, para o botão manual
   *  saber se avisa "atualizado" ou deixa o erro na tela falar por si. */
  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Não foi possível carregar seus pedidos.')
        return false
      }
      setOrders(data.orders || [])
      setError('')
      return true
    } catch {
      setError('Sem conexão. Não conseguimos atualizar seus pedidos.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()

    // O status é alterado pela loja no banco; atualizamos de tempo em tempo
    // enquanto a tela está visível.
    const tick = () => {
      if (document.visibilityState === 'visible') load()
    }
    const id = setInterval(tick, 45000)
    document.addEventListener('visibilitychange', tick)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [load])

  /**
   * Atualização na mão. O intervalo automático é de 45s e quem está esperando
   * a moto chegar não quer contar segundos — o botão busca na hora.
   */
  const refresh = async () => {
    setRefreshing(true)
    const ok = await load()
    setRefreshing(false)
    if (ok) toast('Pedidos atualizados.')
  }

  /** Reabre o WhatsApp com a mensagem do pedido já formatada. */
  const resend = async (orderId) => {
    setResending(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/whatsapp`)
      const data = await res.json()

      if (!res.ok || !data.whatsappUrl) {
        toast(data.error || 'WhatsApp da loja não configurado.', 'error')
        return
      }
      window.open(data.whatsappUrl, '_blank', 'noopener')
    } catch {
      toast('Não foi possível abrir o WhatsApp.', 'error')
    } finally {
      setResending(null)
    }
  }

  if (loading) {
    return (
      <>
        <h1 className="page-title">Meus pedidos</h1>
        <p className="page-sub">Carregando…</p>
        {Array.from({ length: 2 }).map((_, i) => (
          <div className="order-card" key={i}>
            <div className="skeleton" style={{ height: 18, width: '45%', marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 42, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 60 }} />
          </div>
        ))}
      </>
    )
  }

  return (
    <>
      <h1 className="page-title">Meus pedidos</h1>
      <p className="page-sub">
        {orders.length > 0
          ? `${orders.length} ${orders.length === 1 ? 'pedido' : 'pedidos'} · a lista atualiza sozinha`
          : 'Seu histórico aparece aqui'}
      </p>

      {error ? (
        <div className="alert alert-error">
          <IconAlert size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      {orders.length > 0 ? (
        <DayFilter value={day} onChange={setDay} count={visible.length} />
      ) : null}

      {orders.length === 0 && !error ? (
        <div className="empty">
          <div className="empty-icon" aria-hidden>
            🧾
          </div>
          <strong>Você ainda não fez pedidos</strong>
          <p>Que tal começar por um clássico com bacon?</p>
          <Link className="btn btn-primary" href="/inicio">
            Ver o menu
          </Link>
        </div>
      ) : null}

      {orders.length > 0 && visible.length === 0 ? (
        <div className="empty">
          <div className="empty-icon" aria-hidden>
            🗓️
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

              {order.status !== 'canceled' ? <OrderTrack step={order.statusStep} /> : null}

              <div className="order-items">
                {order.items.map((item, i) => (
                  <div className="order-item" key={i}>
                    <span className="qty">{item.qty}x</span>
                    <span className="name">
                      {item.name}
                      {item.notes ? (
                        <em style={{ display: 'block', fontSize: 12, color: 'var(--warn)' }}>
                          ↳ {item.notes}
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
                    {order.address.street}, {order.address.number} — {order.address.neighborhood}
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
                {order.status === 'preparing' ? (
                  <div>
                    <IconClock size={14} />
                    <span>Previsão de entrega: 30 a 45 minutos após a confirmação.</span>
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

                {/* Pedido entregue ou cancelado não muda mais: nada a atualizar
                    e nada a reenviar. */}
                {!FINAL_STATUS.includes(order.status) ? (
                  <div className="order-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={refresh}
                      disabled={refreshing}
                      title="Buscar o status mais recente deste pedido"
                    >
                      {refreshing ? <span className="spinner" /> : <IconRefresh size={16} />}
                      Atualizar status
                    </button>

                    {!HIDE_RESEND_STATUS.includes(order.status) ? (
                      <button
                        className="btn btn-wa btn-sm"
                        onClick={() => resend(order.id)}
                        disabled={resending === order.id}
                      >
                        {resending === order.id ? (
                          <span className="spinner" />
                        ) : (
                          <IconWhatsApp size={16} />
                        )}
                        Reenviar
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ))}
    </>
  )
}
