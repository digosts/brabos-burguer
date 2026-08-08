import { ORDER_STATUS } from '@/lib/orderStatus'

/** Converte um documento do Mongo no objeto simples que o cliente consome. */
export function serializeOrder(order) {
  const status = ORDER_STATUS[order.status] || ORDER_STATUS.preparing
  return {
    id: String(order._id),
    code: order.code,
    items: order.items.map((i) => ({
      name: i.name,
      price: i.price,
      qty: i.qty,
      notes: i.notes || '',
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    paymentMethod: order.paymentMethod,
    changeFor: order.changeFor ?? null,
    address: {
      street: order.address.street,
      number: order.address.number,
      neighborhood: order.address.neighborhood,
      complement: order.address.complement || '',
      reference: order.address.reference || '',
    },
    notes: order.notes || '',
    status: order.status,
    statusLabel: status.label,
    statusTone: status.tone,
    statusStep: status.step,
    createdAt: order.createdAt,
  }
}
