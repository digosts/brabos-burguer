'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { PAYMENT_LABEL } from '@/lib/orderStatus'
import { brl, formatDateTime } from '@/lib/format'
import { useToast } from '@/context/ToastContext'
import {
  IconAlert,
  IconBag,
  IconCard,
  IconCheck,
  IconClock,
  IconFlame,
  IconMapPin,
  IconNote,
  IconTruck,
  IconWhatsApp,
} from './Icons'

const STEPS = [
  { label: 'Recebido', Icon: IconBag },
  { label: 'Em preparação', Icon: IconFlame },
  { label: 'Saiu p/ entrega', Icon: IconTruck },
  { label: 'Entregue', Icon: IconCheck },
]

function Track({ step }) {
  return (
    <div className="track" aria-label={`Etapa ${step + 1} de ${STEPS.length}`}>
      {STEPS.map(({ label, Icon }, i) => (
        <div key={label} style={{ display: 'contents' }}>
          {i > 0 ? <span className={`track-bar${i <= step ? ' done' : ''}`} /> : null}
          <div className={`track-step${i <= step ? ' done' : ''}`}>
            <i>
              <Icon size={15} />
            </i>
            <span>{label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function OrdersView() {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Não foi possível carregar seus pedidos.')
        return
      }
      setOrders(data.orders || [])
      setError('')
    } catch {
      setError('Sem conexão. Não conseguimos atualizar seus pedidos.')
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

      {orders.map((order) => (
        <article className="order-card" key={order.id}>
          <div className="order-head">
            <div>
              <div className="order-code">Pedido #{order.code}</div>
              <div className="order-date">{formatDateTime(order.createdAt)}</div>
            </div>
            <span className={`status ${order.statusTone}`}>
              <span className="dot" />
              {order.statusLabel}
            </span>
          </div>

          {order.status !== 'canceled' ? <Track step={order.statusStep} /> : null}

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

            <button
              className="btn btn-wa btn-sm"
              style={{ marginLeft: 'auto' }}
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
          </div>
        </article>
      ))}
    </>
  )
}
