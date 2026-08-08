'use client'

import { useCart } from '@/context/CartContext'
import { brl } from '@/lib/format'
import { IconMinus, IconPlus } from './Icons'

export default function ProductCard({ product }) {
  const { add, setQty, qtyOf } = useCart()
  const qty = qtyOf(product.id)

  return (
    <article className="product">
      <div className="product-thumb">
        {product.tag ? <span className="tag">{product.tag}</span> : null}
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
        ) : (
          <div className="placeholder" aria-hidden>
            🍔
          </div>
        )}
      </div>

      <div className="product-body">
        <h3 className="product-name">{product.name}</h3>
        {product.description ? <p className="product-desc">{product.description}</p> : null}

        <div className="product-foot">
          <div className="price">
            <strong>{brl(product.price)}</strong>
            {product.oldPrice ? <s>{brl(product.oldPrice)}</s> : null}
          </div>

          {qty === 0 ? (
            <button
              className="add-btn"
              onClick={() => add(product)}
              aria-label={`Adicionar ${product.name} ao carrinho`}
            >
              <IconPlus size={20} />
            </button>
          ) : (
            <div className="stepper">
              <button
                onClick={() => setQty(product.id, qty - 1)}
                aria-label={`Remover uma unidade de ${product.name}`}
              >
                <IconMinus size={16} />
              </button>
              <span aria-live="polite">{qty}</span>
              <button
                onClick={() => add(product)}
                aria-label={`Adicionar uma unidade de ${product.name}`}
              >
                <IconPlus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
