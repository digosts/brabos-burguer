'use client'

import { useEffect, useState } from 'react'
import { dayKey } from '@/lib/orderDays'
import { IconCalendar, IconX } from './Icons'

/**
 * Campo de data das listas de pedidos.
 *
 * Filtra em cima da lista que já está na tela — as duas rotas devolvem o
 * histórico inteiro de uma vez, então não há ida ao servidor a cada troca
 * de dia.
 */
export default function DayFilter({ value, onChange, count }) {
  // O "hoje" do servidor pode estar em outro fuso: definir o `max` só depois
  // de montar evita que o HTML renderizado lá e o do navegador divirjam.
  const [today, setToday] = useState('')
  useEffect(() => setToday(dayKey(new Date())), [])

  return (
    <div className="day-filter">
      <label className="day-filter-field">
        <IconCalendar size={16} />
        <input
          type="date"
          value={value}
          max={today || undefined}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Filtrar pedidos por data"
        />
      </label>

      {value ? (
        <>
          <span className="day-filter-count">
            {count} {count === 1 ? 'pedido' : 'pedidos'}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange('')}>
            <IconX size={15} />
            Limpar
          </button>
        </>
      ) : null}
    </div>
  )
}
