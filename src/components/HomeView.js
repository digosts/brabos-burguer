'use client'

import { useEffect, useMemo, useState } from 'react'
import ProductCard from './ProductCard'
import { useAuth } from '@/context/AuthContext'
import { loadGuest } from '@/lib/guest'
import { SHOP } from '@/lib/shop'
import { brl } from '@/lib/format'
import {
  IconAlert,
  IconClock,
  IconFlame,
  IconSearch,
  IconTruck,
  IconWifiOff
} from './Icons'

function Skeletons() {
  return (
    <div className="product-grid" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="product" key={i}>
          <div className="skeleton product-thumb" />
          <div className="product-body" style={{ gap: 8 }}>
            <div className="skeleton" style={{ height: 15, width: '65%' }} />
            <div className="skeleton" style={{ height: 12, width: '90%' }} />
            <div className="skeleton" style={{ height: 12, width: '45%' }} />
            <div
              className="skeleton"
              style={{ height: 26, width: '38%', marginTop: 'auto' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HomeView() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState('all')
  // Quem pede sem login não tem perfil, mas o aparelho lembra o nome do
  // último pedido — dá para chamar a pessoa pelo nome mesmo assim.
  const [guestName, setGuestName] = useState('')

  useEffect(() => {
    if (!user) setGuestName(loadGuest().name)
  }, [user])

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const res = await fetch('/api/catalog', { cache: 'no-store' })
        const data = await res.json()
        if (!alive) return

        if (!res.ok) {
          setError(data.error || 'Não foi possível carregar o menu.')
          return
        }
        setCategories(data.categories || [])
      } catch {
        if (alive) setError('offline')
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()

    return categories
      .filter(c => activeCat === 'all' || c.id === activeCat)
      .map(c => ({
        ...c,
        products: q
          ? c.products.filter(
              p =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q)
            )
          : c.products
      }))
      .filter(c => c.products.length > 0)
  }, [categories, activeCat, query])

  const totalProducts = categories.reduce((n, c) => n + c.products.length, 0)
  const firstName = (user?.name || guestName).split(' ')[0]

  return (
    <>
      <div className="hero">
        <h2>{firstName ? `Boa, ${firstName}! 🍔` : 'Bora pedir? 🍔'}</h2>
        <p>
          Monte seu pedido, escolha como pagar na entrega e acompanhe o preparo
          por aqui.
        </p>
        <div className="hero-meta">
          <span className="chip">
            <IconClock size={13} /> 30–45 min
          </span>
          <span className="chip">
            <IconTruck size={13} />
            {SHOP.deliveryFee > 0
              ? `Entrega ${brl(SHOP.deliveryFee)}`
              : 'Entrega grátis'}
          </span>
          <span className="chip">
            <IconFlame size={13} /> Pagamento na entrega ou via Pix
          </span>
        </div>
      </div>

      {totalProducts > 0 ? (
        <div className="search">
          <IconSearch size={18} />
          <input
            className="input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar no menu…"
            type="search"
            aria-label="Buscar produtos"
          />
        </div>
      ) : null}

      {categories.length > 1 ? (
        <div className="cat-bar">
          <div className="cat-scroll">
            <button
              className={`cat-pill${activeCat === 'all' ? ' active' : ''}`}
              onClick={() => setActiveCat('all')}
            >
              Todos
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                className={`cat-pill${activeCat === c.id ? ' active' : ''}`}
                onClick={() => setActiveCat(c.id)}
              >
                {c.icon ? <span aria-hidden>{c.icon}</span> : null}
                {c.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {loading ? <Skeletons /> : null}

      {!loading && error === 'offline' ? (
        <div className="empty">
          <div className="empty-icon" style={{ color: 'var(--warn)' }}>
            <IconWifiOff size={30} />
          </div>
          <strong>Você está sem conexão</strong>
          <p>Reconecte para ver o menu atualizado.</p>
          <button className="btn btn-ghost" onClick={() => location.reload()}>
            Tentar de novo
          </button>
        </div>
      ) : null}

      {!loading && error && error !== 'offline' ? (
        <div className="alert alert-error">
          <IconAlert size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Sem produtos no banco ainda: explica como cadastrar. */}
      {!loading && !error && categories.length === 0 ? (
        <div className="empty">
          <div className="empty-icon" aria-hidden>
            📋
          </div>
          <strong>O menu ainda está vazio</strong>
          <p>
            Cadastre as categorias e os produtos no MongoDB (coleções{' '}
            <b>categories</b> e <b>products</b>) e eles aparecem aqui na hora.
          </p>
        </div>
      ) : null}

      {/* Busca sem resultado. */}
      {!loading && !error && categories.length > 0 && visible.length === 0 ? (
        <div className="empty">
          <div className="empty-icon" aria-hidden>
            🔍
          </div>
          <strong>Nada encontrado</strong>
          <p>Não achamos nada para “{query}”. Tente outro termo.</p>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setQuery('')
              setActiveCat('all')
            }}
          >
            Limpar busca
          </button>
        </div>
      ) : null}

      {visible.map(cat => (
        <section key={cat.id}>
          <h2 className="section-title" id={`cat-${cat.id}`}>
            {cat.icon ? <span aria-hidden>{cat.icon}</span> : null}
            {cat.name}
            <span className="count">{cat.products.length}</span>
          </h2>
          {cat.description ? (
            <p
              className="text-mute"
              style={{ fontSize: 13, marginTop: -8, marginBottom: 14 }}
            >
              {cat.description}
            </p>
          ) : null}
          <div className="product-grid">
            {cat.products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
