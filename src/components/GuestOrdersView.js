'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { PAYMENT_LABEL } from '@/lib/orderStatus'
import { brl, formatTime } from '@/lib/format'
import { filterOrdersByDay, groupOrdersByDay } from '@/lib/orderDays'
import { loadGuestOrders } from '@/lib/guest'
import { useToast } from '@/context/ToastContext'
import DayFilter from './DayFilter'
import OrderTrack from './OrderTrack'
import {
  IconCard,
  IconClock,
  IconInfo,
  IconMapPin,
  IconNote,
  IconRefresh,
  IconWhatsApp
} from './Icons'

/** Depois que a loja põe o pedido na rua, reenviar a mensagem só confunde. */
const HIDE_RESEND_STATUS = ['on_the_way', 'delivered']

/** Entregue ou cancelado é ponto final: não há status novo para buscar. */
const FINAL_STATUS = ['delivered', 'canceled']

/**
 * Histórico de quem pede sem conta.
 *
 * A lista em si mora no localStorage deste aparelho — itens, endereço e
 * valores nunca precisam ser buscados de novo. O que vem do servidor é só o
 * andamento, consultado pelo `trackingId` sorteado na criação do pedido:
 * é ele que faz as vezes de login aqui.
 */
export default function GuestOrdersView() {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [day, setDay] = useState('')

  const visible = useMemo(() => filterOrdersByDay(orders, day), [orders, day])
  const groups = useMemo(() => groupOrdersByDay(visible), [visible])

  /**
   * Pergunta ao servidor em que pé estão os pedidos deste aparelho. Devolve
   * `true` quando a resposta veio, para o botão manual saber o que avisar.
   */
  const loadStatus = useCallback(async list => {
    const ids = list.map(o => o.trackingId).filter(Boolean)
    if (ids.length === 0) return false

    try {
      const res = await fetch(`/api/orders/track?ids=${ids.join(',')}`, {
        cache: 'no-store'
      })
      if (!res.ok) return false

      const data = await res.json()
      setStatus(
        Object.fromEntries((data.orders || []).map(o => [o.trackingId, o]))
      )
      return true
    } catch {
      // Sem conexão: a lista local continua na tela, só sem o andamento.
      return false
    }
  }, [])

  // O localStorage só existe no navegador: ler no efeito evita que o HTML
  // do servidor e o do cliente saiam diferentes.
  useEffect(() => {
    const list = loadGuestOrders()
    setOrders(list)
    setLoading(false)
    loadStatus(list)

    // Quem muda o status é a loja, do outro lado. Atualizamos de tempos em
    // tempos enquanto a tela está à vista — mesmo ritmo da tela de quem
    // tem conta.
    const tick = () => {
      if (document.visibilityState === 'visible') loadStatus(list)
    }
    const id = setInterval(tick, 45000)
    document.addEventListener('visibilitychange', tick)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [loadStatus])

  /**
   * Atualização na mão: o intervalo automático é de 45s e quem está esperando
   * a entrega não quer contar segundos.
   */
  const refresh = async () => {
    setRefreshing(true)
    const ok = await loadStatus(orders)
    setRefreshing(false)
    if (ok) toast('Pedidos atualizados.')
    else toast('Não foi possível buscar o andamento agora.', 'error')
  }

  if (loading) {
    return (
      <>
        <h1 className="page-title">Meus pedidos</h1>
        <p className="page-sub">Carregando…</p>
        {Array.from({ length: 2 }).map((_, i) => (
          <div className="order-card" key={i}>
            <div
              className="skeleton"
              style={{ height: 18, width: '45%', marginBottom: 14 }}
            />
            <div
              className="skeleton"
              style={{ height: 42, marginBottom: 12 }}
            />
            <div className="skeleton" style={{ height: 60 }} />
          </div>
        ))}
      </>
    )
  }

  if (orders.length === 0) {
    return (
      <>
        <h1 className="page-title">Meus pedidos</h1>
        <p className="page-sub">Seu histórico aparece aqui</p>

        <div className="empty">
          <div className="empty-icon" aria-hidden>
            🧾
          </div>
          <strong>Você ainda não fez pedidos</strong>
          <p>Que tal começar por um clássico com bacon?</p>
          <Link className="btn btn-primary" href="/">
            Ver o cardápio
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="page-title">Meus pedidos</h1>
      <p className="page-sub">
        {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
      </p>

      <DayFilter value={day} onChange={setDay} count={visible.length} />

      {visible.length === 0 ? (
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

      {groups.map(group => (
        <section className="day-group" key={group.key}>
          <header className="day-head">
            <h2 className="day-title">{group.label}</h2>
            <span className="day-sum">
              {group.orders.length}{' '}
              {group.orders.length === 1 ? 'pedido' : 'pedidos'} ·{' '}
              {brl(group.total)}
            </span>
          </header>

          {group.orders.map(order => {
            const live = order.trackingId ? status[order.trackingId] : null

            // Sem `trackingId` não há o que perguntar ao servidor (pedidos
            // antigos, salvos antes do acompanhamento existir), e depois de
            // entregue ou cancelado não há status novo para buscar.
            const canRefresh =
              Boolean(order.trackingId) && !FINAL_STATUS.includes(live?.status)
            // O link do WhatsApp foi salvo junto com o pedido, então o reenvio
            // funciona sem consultar o servidor.
            const canResend =
              Boolean(order.whatsappUrl) &&
              !HIDE_RESEND_STATUS.includes(live?.status)

            return (
              <article className="order-card" key={order.id}>
                <div className="order-head">
                  <div>
                    <div className="order-code">Pedido #{order.code}</div>
                    <div className="order-date">
                      {formatTime(order.createdAt)}
                    </div>
                  </div>
                  {live ? (
                    <span className={`status ${live.statusTone}`}>
                      <span className="dot" />
                      {live.statusLabel}
                    </span>
                  ) : null}
                </div>

                {live && live.status !== 'canceled' ? (
                  <OrderTrack step={live.statusStep} />
                ) : null}

                <div className="order-items">
                  {order.items.map((item, i) => (
                    <div className="order-item" key={i}>
                      <span className="qty">{item.qty}x</span>
                      <span className="name">
                        {item.name}
                        {item.notes ? (
                          <em
                            style={{
                              display: 'block',
                              fontSize: 12,
                              color: 'var(--warn)'
                            }}
                          >
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
                      {order.address.street}, {order.address.number} —{' '}
                      {order.address.neighborhood}
                      {order.address.complement
                        ? ` (${order.address.complement})`
                        : ''}
                      {order.address.reference
                        ? ` · Ref: ${order.address.reference}`
                        : ''}
                    </span>
                  </div>
                  <div>
                    <IconCard size={14} />
                    <span>
                      {PAYMENT_LABEL[order.paymentMethod] ||
                        order.paymentMethod}
                    </span>
                  </div>
                  {order.notes ? (
                    <div>
                      <IconNote size={14} />
                      <span>{order.notes}</span>
                    </div>
                  ) : null}
                  {live?.status === 'preparing' ? (
                    <div>
                      <IconClock size={14} />
                      <span>
                        Previsão de entrega: 30 a 45 minutos após a confirmação.
                      </span>
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

                  {canRefresh || canResend ? (
                    <div className="order-actions">
                      {canRefresh ? (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={refresh}
                          disabled={refreshing}
                          title="Buscar o status mais recente deste pedido"
                        >
                          {refreshing ? (
                            <span className="spinner" />
                          ) : (
                            <IconRefresh size={16} />
                          )}
                          Atualizar status
                        </button>
                      ) : null}

                      {canResend ? (
                        <a
                          className="btn btn-wa btn-sm"
                          href={order.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <IconWhatsApp size={16} />
                          Reenviar
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })}
        </section>
      ))}
    </>
  )
}
