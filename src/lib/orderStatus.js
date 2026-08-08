/**
 * Rótulos de status e pagamento.
 *
 * Fica separado do model porque o cliente também usa estes textos, e o
 * model carrega o mongoose — que não deve ir para o bundle do navegador.
 *
 * Para mudar o status de um pedido, edite o campo `status` do documento
 * na coleção `orders` usando uma destas chaves.
 */
export const ORDER_STATUS = {
  preparing: { label: 'Em preparação', tone: 'warn', step: 1 },
  on_the_way: { label: 'Saiu para entrega', tone: 'info', step: 2 },
  delivered: { label: 'Entregue', tone: 'ok', step: 3 },
  canceled: { label: 'Cancelado', tone: 'bad', step: 0 },
}

export const PAYMENT_LABEL = {
  pix: 'PIX (na entrega)',
  credit: 'Cartão de crédito (na entrega)',
  debit: 'Cartão de débito (na entrega)',
}
