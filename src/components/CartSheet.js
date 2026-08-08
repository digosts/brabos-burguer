'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sheet from './Sheet'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { PAYMENT_METHODS, SHOP } from '@/lib/shop'
import { brl, maskPhone } from '@/lib/format'
import { loadGuest, pushGuestOrder, saveGuest } from '@/lib/guest'
import {
  IconCard,
  IconCheckCircle,
  IconClock,
  IconMapPin,
  IconMinus,
  IconNote,
  IconPhone,
  IconPix,
  IconPlus,
  IconTrash,
  IconUser,
  IconWhatsApp
} from './Icons'

const EMPTY_ADDRESS = {
  street: '',
  number: '',
  neighborhood: '',
  complement: '',
  reference: ''
}

export default function CartSheet() {
  const {
    items,
    count,
    subtotal,
    isOpen,
    setOpen,
    setQty,
    setNotes,
    remove,
    clear
  } = useCart()
  const { user, setUser } = useAuth()
  const toast = useToast()
  const router = useRouter()

  // Sem sessão o checkout pede nome e WhatsApp aqui mesmo — é o único
  // momento em que a loja fica sabendo para quem está entregando.
  const isGuest = !user

  const [contact, setContact] = useState({ name: '', phone: '' })
  const [address, setAddress] = useState(EMPTY_ADDRESS)
  const [addressTouched, setAddressTouched] = useState(false)
  const [payment, setPayment] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [changeFor, setChangeFor] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [openNoteFor, setOpenNoteFor] = useState(null)
  const [result, setResult] = useState(null)

  const guestHydrated = useRef(false)

  // Pré-preenche com o endereço salvo no perfil (o do último pedido).
  // Depois que o cliente mexe nos campos, o que ele digitou manda: sem essa
  // trava, qualquer atualização do usuário (salvar o perfil, revalidar a
  // sessão) apagaria o endereço que ele estava escrevendo aqui.
  useEffect(() => {
    if (addressTouched) return
    if (user?.address) {
      setAddress({ ...EMPTY_ADDRESS, ...user.address })
    }
  }, [user, addressTouched])

  // O mesmo conforto para quem pede sem login, só que lendo do aparelho.
  // Roda uma vez: o localStorage não muda sozinho, e repetir isso apagaria
  // o que a pessoa estivesse digitando.
  useEffect(() => {
    if (!isGuest || guestHydrated.current) return
    guestHydrated.current = true

    const saved = loadGuest()
    setContact({ name: saved.name, phone: saved.phone })
    if (saved.address.street) setAddress({ ...EMPTY_ADDRESS, ...saved.address })
  }, [isGuest])

  const setContactField = key => e => {
    const value = key === 'phone' ? maskPhone(e.target.value) : e.target.value
    setContact(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const deliveryFee = SHOP.deliveryFee
  const total = subtotal + deliveryFee

  const belowMinimum = SHOP.minOrder > 0 && subtotal < SHOP.minOrder

  const setField = key => e => {
    setAddressTouched(true)
    setAddress(prev => ({ ...prev, [key]: e.target.value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const next = {}
    if (isGuest) {
      if (contact.name.trim().length < 2) next.name = 'Informe seu nome'
      if (contact.phone.replace(/\D/g, '').length < 10)
        next.phone = 'Informe DDD + número'
    }
    if (!address.street.trim()) next.street = 'Informe o nome da rua'
    if (!address.number.trim()) next.number = 'Informe o número'
    if (!address.neighborhood.trim()) next.neighborhood = 'Informe o bairro'
    if (!payment) next.payment = 'Escolha como vai pagar na entrega'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    if (!validate()) {
      toast('Faltam dados para a entrega', 'error')
      return
    }

    // A aba precisa nascer aqui dentro, ainda no clique: depois do `await`
    // o navegador trata window.open como pop-up e bloqueia. Ela fica em
    // branco por um instante e recebe a URL assim que o pedido é salvo.
    const waTab = SHOP.whatsapp ? window.open('', '_blank') : null
    if (waTab) waTab.opener = null

    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.productId,
            qty: i.qty,
            notes: i.notes
          })),
          paymentMethod: payment,
          changeFor:
            payment === 'pix' && changeFor
              ? Number(changeFor.replace(',', '.'))
              : null,
          address,
          notes: orderNotes,
          // Só o pedido sem login carrega o contato: com sessão, o servidor
          // usa o do perfil e ignora qualquer nome que venha daqui.
          ...(isGuest
            ? { customerName: contact.name, customerPhone: contact.phone }
            : null)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        waTab?.close()
        toast(data.error || 'Não foi possível enviar o pedido', 'error')
        // A API devolve quais campos faltaram.
        if (Array.isArray(data.fields)) {
          const map = {
            rua: 'street',
            número: 'number',
            bairro: 'neighborhood',
            customerName: 'name',
            customerPhone: 'phone'
          }
          setErrors(
            Object.fromEntries(
              data.fields.map(f => [map[f] || f, 'Campo obrigatório'])
            )
          )
        }
        return
      }

      // O pedido já está salvo — o carrinho pode ser esvaziado.
      setResult(data)
      clear()

      if (isGuest) {
        // Sem perfil para guardar, o aparelho é que lembra: no próximo
        // pedido o formulário já abre preenchido e o histórico local ganha
        // mais uma linha, com o link do WhatsApp pronto para reenvio.
        saveGuest({
          name: contact.name,
          phone: contact.phone,
          address: data.order.address
        })
        pushGuestOrder(data.order, data.whatsappUrl)
      } else {
        setUser(prev =>
          prev ? { ...prev, address: data.order.address } : prev
        )
      }

      router.refresh()

      // Abre o WhatsApp sozinho, para o cliente não esquecer de mandar.
      // Se o pop-up foi bloqueado, vai na própria aba: o pedido já está
      // salvo e pode ser reenviado depois pela tela de pedidos.
      if (data.whatsappUrl) {
        if (waTab) waTab.location.href = data.whatsappUrl
        else window.location.href = data.whatsappUrl
      } else {
        waTab?.close()
      }
    } catch (err) {
      waTab?.close()
      console.error(err)
      toast('Sem conexão. Verifique a internet e tente de novo.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const closeSheet = () => {
    setOpen(false)
    // Depois de um pedido enviado, limpa o estado da próxima abertura.
    if (result) {
      setResult(null)
      setPayment('')
      setOrderNotes('')
      setChangeFor('')
    }
  }

  const paymentIcon = icon =>
    icon === 'pix' ? <IconPix size={22} /> : <IconCard size={22} />

  const footer = useMemo(() => {
    if (result) {
      return (
        <div style={{ display: 'grid', gap: 10 }}>
          {result.whatsappUrl ? (
            <a
              className="btn btn-wa btn-block"
              href={result.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconWhatsApp size={20} />
              Abrir o WhatsApp com o pedido
            </a>
          ) : null}
          <button
            className="btn btn-ghost btn-block"
            onClick={() => {
              closeSheet()
              router.push(isGuest ? '/meus-pedidos' : '/pedidos')
            }}
          >
            Ver meus pedidos
          </button>
        </div>
      )
    }

    if (count === 0) return null

    return (
      <>
        <div className="totals">
          <div className="totals-line">
            <span>
              Subtotal · {count} {count === 1 ? 'item' : 'itens'}
            </span>
            <span>{brl(subtotal)}</span>
          </div>
          <div className={`totals-line${deliveryFee === 0 ? ' free' : ''}`}>
            <span>Taxa de entrega</span>
            <span>{deliveryFee === 0 ? 'Grátis' : brl(deliveryFee)}</span>
          </div>
          <div className="totals-line grand">
            <span>Total</span>
            <span>{brl(total)}</span>
          </div>
        </div>

        {belowMinimum ? (
          <div className="alert alert-warn">
            <IconClock size={16} />
            <span>
              O pedido mínimo é {brl(SHOP.minOrder)}. Faltam{' '}
              {brl(SHOP.minOrder - subtotal)}.
            </span>
          </div>
        ) : null}

        <button
          className="btn btn-primary btn-block"
          onClick={submit}
          disabled={submitting || belowMinimum}
        >
          {submitting ? (
            <>
              <span className="spinner" /> Enviando…
            </>
          ) : (
            <>Fechar pedido · {brl(total)}</>
          )}
        </button>

        <p
          className="center text-mute"
          style={{ fontSize: 11.5, marginTop: 9 }}
        >
          Você paga na entrega. Nenhum dado de cartão é pedido aqui.
        </p>
      </>
    )
  }, [
    result,
    count,
    subtotal,
    deliveryFee,
    total,
    submitting,
    belowMinimum,
    items,
    payment,
    address,
    orderNotes,
    changeFor,
    contact,
    isGuest
  ])

  return (
    <Sheet
      open={isOpen}
      onClose={closeSheet}
      title={result ? 'Pedido confirmado!' : 'Seu carrinho'}
      subtitle={
        result
          ? `Pedido #${result.order.code}`
          : count > 0
            ? `${count} ${count === 1 ? 'item' : 'itens'} · ${brl(subtotal)}`
            : 'Nenhum item ainda'
      }
      footer={footer}
    >
      {/* ── pedido enviado ─────────────────────────────────── */}
      {result ? (
        <div>
          <div className="empty" style={{ padding: '18px 0 22px' }}>
            <div className="empty-icon" style={{ color: 'var(--ok)' }}>
              <IconCheckCircle size={34} />
            </div>
            <strong>Recebemos seu pedido #{result.order.code}</strong>
            <p>
              Abrimos o WhatsApp com o resumo pronto. Toque em enviar lá para a
              cozinha começar a preparar.
            </p>
          </div>

          <div className="alert alert-info">
            <IconWhatsApp size={16} />
            <span>
              Se o WhatsApp não abrir sozinho, use o botão abaixo. Seu pedido já
              está salvo de qualquer jeito — dá para reenviar em{' '}
              {isGuest ? '“Meus pedidos”' : '“Pedidos”'}.
            </span>
          </div>

          <div className="order-items">
            {result.order.items.map((it, i) => (
              <div className="order-item" key={i}>
                <span className="qty">{it.qty}x</span>
                <span className="name">{it.name}</span>
                <span className="val">{brl(it.price * it.qty)}</span>
              </div>
            ))}
          </div>

          <div className="totals">
            <div className="totals-line">
              <span>Subtotal</span>
              <span>{brl(result.order.subtotal)}</span>
            </div>
            {result.order.deliveryFee > 0 ? (
              <div className="totals-line">
                <span>Taxa de entrega</span>
                <span>{brl(result.order.deliveryFee)}</span>
              </div>
            ) : null}
            <div className="totals-line grand">
              <span>Total</span>
              <span>{brl(result.order.total)}</span>
            </div>
          </div>

          <div className="block">
            <div className="block-head">
              <IconMapPin size={17} /> Entrega em
            </div>
            <p
              style={{
                fontSize: 13.5,
                color: 'var(--text-dim)',
                lineHeight: 1.6
              }}
            >
              {result.order.address.street}, {result.order.address.number}
              <br />
              Bairro {result.order.address.neighborhood}
              {result.order.address.complement ? (
                <>
                  <br />
                  {result.order.address.complement}
                </>
              ) : null}
            </p>
          </div>
        </div>
      ) : count === 0 ? (
        /* ── carrinho vazio ──────────────────────────────── */
        <div className="empty">
          <div className="empty-icon" aria-hidden>
            🛒
          </div>
          <strong>Seu carrinho está vazio</strong>
          <p>Escolha um hambúrguer na tela inicial e ele aparece aqui.</p>
          <button className="btn btn-primary" onClick={closeSheet}>
            Ver o menu
          </button>
        </div>
      ) : (
        /* ── carrinho + checkout ─────────────────────────── */
        <div>
          {items.map(item => (
            <div className="cart-line" key={item.productId}>
              <div className="cart-line-thumb">
                {item.image ? (
                  <img src={item.image} alt="" loading="lazy" />
                ) : (
                  <div className="placeholder" aria-hidden>
                    🍔
                  </div>
                )}
              </div>

              <div className="cart-line-body">
                <div className="cart-line-name">{item.name}</div>
                <div className="cart-line-unit">{brl(item.price)} cada</div>

                {item.notes && openNoteFor !== item.productId ? (
                  <div className="cart-line-notes">📝 {item.notes}</div>
                ) : null}

                {openNoteFor === item.productId ? (
                  <textarea
                    className="textarea"
                    style={{ marginTop: 8, minHeight: 64 }}
                    placeholder="Ex: sem cebola, ponto da carne ao ponto…"
                    value={item.notes}
                    maxLength={200}
                    autoFocus
                    onChange={e => setNotes(item.productId, e.target.value)}
                    onBlur={() => setOpenNoteFor(null)}
                  />
                ) : (
                  <button
                    className="note-btn"
                    onClick={() => setOpenNoteFor(item.productId)}
                  >
                    <IconNote size={12} />
                    {item.notes ? 'Editar observação' : 'Adicionar observação'}
                  </button>
                )}
              </div>

              <div className="cart-line-side">
                <span className="cart-line-total">
                  {brl(item.price * item.qty)}
                </span>
                <div className="stepper">
                  {item.qty === 1 ? (
                    <button
                      onClick={() => remove(item.productId)}
                      aria-label="Remover item"
                    >
                      <IconTrash size={15} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setQty(item.productId, item.qty - 1)}
                      aria-label="Diminuir quantidade"
                    >
                      <IconMinus size={15} />
                    </button>
                  )}
                  <span>{item.qty}</span>
                  <button
                    onClick={() => setQty(item.productId, item.qty + 1)}
                    aria-label="Aumentar quantidade"
                  >
                    <IconPlus size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* ── contato (só sem login) ───────────────────── */}
          {isGuest ? (
            <div className="block">
              <div className="block-head">
                <IconUser size={17} />
                Seus dados
                <span className="req-badge">Obrigatório</span>
              </div>

              <label className="field">
                <span className="field-label">
                  Nome <span className="req">*</span>
                </span>
                <input
                  className="input"
                  value={contact.name}
                  onChange={setContactField('name')}
                  placeholder="Como podemos te chamar"
                  autoComplete="name"
                  maxLength={80}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name ? (
                  <span className="field-error">{errors.name}</span>
                ) : null}
              </label>

              <label className="field" style={{ marginBottom: 0 }}>
                <span className="field-label">
                  <IconPhone size={14} /> WhatsApp{' '}
                  <span className="req">*</span>
                </span>
                <input
                  className="input"
                  value={contact.phone}
                  onChange={setContactField('phone')}
                  placeholder="(11) 98888-7777"
                  autoComplete="tel"
                  inputMode="tel"
                  aria-invalid={Boolean(errors.phone)}
                />
                {errors.phone ? (
                  <span className="field-error">{errors.phone}</span>
                ) : (
                  <span className="field-hint">
                    A loja usa esse número para confirmar a entrega. Fica salvo
                    neste aparelho para o próximo pedido.
                  </span>
                )}
              </label>
            </div>
          ) : null}

          {/* ── endereço ─────────────────────────────────── */}
          <div className="block">
            <div className="block-head">
              <IconMapPin size={17} />
              Endereço de entrega
              <span className="req-badge">Obrigatório</span>
            </div>

            {isGuest && address.street && !addressTouched ? (
              <p
                className="field-hint"
                style={{ marginTop: -6, marginBottom: 12 }}
              >
                Preenchemos com o endereço do seu último pedido neste aparelho —
                é só alterar se a entrega for em outro lugar.
              </p>
            ) : null}

            {user?.address?.street && !addressTouched ? (
              <p
                className="field-hint"
                style={{ marginTop: -6, marginBottom: 12 }}
              >
                Preenchemos com o endereço do seu último pedido — é só alterar
                se a entrega for em outro lugar.
              </p>
            ) : null}

            <div className="row row-street">
              <label className="field" style={{ margin: 0 }}>
                <span className="field-label">
                  Rua <span className="req">*</span>
                </span>
                <input
                  className="input"
                  value={address.street}
                  onChange={setField('street')}
                  placeholder="Rua das Flores"
                  autoComplete="address-line1"
                  aria-invalid={Boolean(errors.street)}
                />
                {errors.street ? (
                  <span className="field-error">{errors.street}</span>
                ) : null}
              </label>

              <label className="field" style={{ margin: 0 }}>
                <span className="field-label">
                  Número <span className="req">*</span>
                </span>
                <input
                  className="input"
                  value={address.number}
                  onChange={setField('number')}
                  placeholder="123"
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.number)}
                />
                {errors.number ? (
                  <span className="field-error">{errors.number}</span>
                ) : null}
              </label>
            </div>

            <label className="field" style={{ marginTop: 12 }}>
              <span className="field-label">
                Bairro <span className="req">*</span>
              </span>
              <input
                className="input"
                value={address.neighborhood}
                onChange={setField('neighborhood')}
                placeholder="Centro"
                autoComplete="address-level3"
                aria-invalid={Boolean(errors.neighborhood)}
              />
              {errors.neighborhood ? (
                <span className="field-error">{errors.neighborhood}</span>
              ) : null}
            </label>

            <div className="row row-2">
              <label className="field" style={{ margin: 0 }}>
                <span className="field-label">Complemento</span>
                <input
                  className="input"
                  value={address.complement}
                  onChange={setField('complement')}
                  placeholder="Apto 42, Bloco B"
                  autoComplete="address-line2"
                />
              </label>

              <label className="field" style={{ margin: 0 }}>
                <span className="field-label">Referência</span>
                <input
                  className="input"
                  value={address.reference}
                  onChange={setField('reference')}
                  placeholder="Portão azul"
                />
              </label>
            </div>
          </div>

          {/* ── pagamento ────────────────────────────────── */}
          <div className="block">
            <div className="block-head">
              <IconCard size={17} />
              Forma de pagamento
              <span className="req-badge">Na entrega</span>
            </div>

            <div className="pay-grid">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  className={`pay-option${payment === m.value ? ' active' : ''}`}
                  onClick={() => {
                    setPayment(m.value)
                    setErrors(prev => ({ ...prev, payment: undefined }))
                  }}
                  aria-pressed={payment === m.value}
                >
                  {paymentIcon(m.icon)}
                  <strong>{m.label}</strong>
                  <span>{m.hint}</span>
                </button>
              ))}
            </div>

            {errors.payment ? (
              <span className="field-error">{errors.payment}</span>
            ) : null}

            {payment === 'pix' ? (
              <label
                className="field"
                style={{ marginTop: 14, marginBottom: 0 }}
              >
                <span className="field-label">
                  Precisa de troco? (opcional)
                </span>
                <input
                  className="input"
                  value={changeFor}
                  onChange={e =>
                    setChangeFor(e.target.value.replace(/[^\d.,]/g, ''))
                  }
                  placeholder="Ex: 100"
                  inputMode="decimal"
                />
                <span className="field-hint">
                  Se for pagar em dinheiro na entrega, diga o valor da nota.
                </span>
              </label>
            ) : null}

            <div
              className="alert alert-info"
              style={{ marginTop: 14, marginBottom: 0 }}
            >
              <IconClock size={16} />
              <span>
                O pagamento é feito via PIX ou em Credito/Débito com maquininha
                na entrega.
              </span>
            </div>
          </div>

          {/* ── observações ──────────────────────────────── */}
          <div className="block">
            <div className="block-head">
              <IconNote size={17} /> Observações do pedido
            </div>
            <textarea
              className="textarea"
              value={orderNotes}
              maxLength={500}
              onChange={e => setOrderNotes(e.target.value)}
              placeholder="Alguma instrução para a cozinha ou para o entregador?"
            />
          </div>
        </div>
      )}
    </Sheet>
  )
}
