/**
 * Agrupamento das listas de pedidos por dia.
 *
 * O dia é sempre o do relógio de quem está olhando a tela — o mesmo critério
 * do `<input type="date">` do filtro, para que escolher "08/08" traga
 * exatamente o que está sob o cabeçalho daquele dia.
 */

/** Data local no formato do `<input type="date">`: 2026-08-08. */
export function dayKey(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''

  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

/**
 * Título do grupo: "Hoje", "Ontem" ou "sex., 08/08/2026".
 *
 * Só é chamado depois que a lista chega da API — ou seja, já no navegador.
 * Se virasse HTML do servidor, "Hoje" poderia ser calculado num fuso
 * diferente do de quem lê.
 */
export function dayLabel(key) {
  const [year, month, day] = String(key).split('-').map(Number)
  if (!year || !month || !day) return 'Sem data'

  const date = new Date(year, month - 1, day)
  const today = new Date()
  if (key === dayKey(today)) return 'Hoje'

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (key === dayKey(yesterday)) return 'Ontem'

  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Quebra a lista em blocos de um dia, preservando a ordem que veio da API.
 *
 * Os pedidos de um mesmo dia caem no mesmo bloco mesmo que não estejam lado
 * a lado — é o caso da tela de entregues do admin, ordenada pela hora da
 * entrega: um pedido de ontem finalizado hoje não abre um segundo "ontem".
 */
export function groupOrdersByDay(orders) {
  const groups = new Map()

  for (const order of orders) {
    const key = dayKey(order.createdAt)
    let group = groups.get(key)

    if (!group) {
      group = { key, label: dayLabel(key), orders: [], total: 0 }
      groups.set(key, group)
    }

    group.orders.push(order)
    group.total += Number(order.total) || 0
  }

  return [...groups.values()]
}

/** Mantém só os pedidos do dia escolhido; sem filtro, devolve a lista inteira. */
export function filterOrdersByDay(orders, day) {
  if (!day) return orders
  return orders.filter((order) => dayKey(order.createdAt) === day)
}
