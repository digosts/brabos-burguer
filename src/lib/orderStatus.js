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
  /**
   * Onde todo pedido novo nasce.
   *
   * A cozinha só começa depois que alguém da loja confere o pedido no
   * WhatsApp e confirma. Enquanto isso o cliente vê "Recebido" na trilha —
   * o pedido existe e está na fila, só não virou comida ainda.
   */
  awaiting_confirmation: { label: 'Aguardando confirmação', tone: 'warn', step: 0 },
  preparing: { label: 'Em preparação', tone: 'warn', step: 1 },
  on_the_way: { label: 'Saiu para entrega', tone: 'info', step: 2 },
  delivered: { label: 'Entregue', tone: 'ok', step: 3 },
  canceled: { label: 'Cancelado', tone: 'bad', step: 0 },
}

/** Status que ainda ocupam a fila da loja. */
export const OPEN_STATUS = ['awaiting_confirmation', 'preparing', 'on_the_way']

/** Status que já saíram da fila — a aba de conferência do admin. */
export const CLOSED_STATUS = ['delivered', 'canceled']

/**
 * Os únicos status que o admin pode atribuir pela interface.
 *
 * A API valida contra esta lista, e não contra o enum do model: assim, se
 * um status novo entrar no `ORDER_STATUS` (um `refunded`, por exemplo), ele
 * não vira automaticamente uma ação disponível para quem chama a rota.
 */
export const ADMIN_ASSIGNABLE_STATUS = ['preparing', 'on_the_way', 'delivered', 'canceled']

/**
 * Linha extra na tela do cliente, explicando o que está acontecendo.
 *
 * Fica aqui, e não nas telas, porque as três listas de pedidos (com conta,
 * sem conta e a do admin) mostram o mesmo texto — e porque um status sem
 * explicação vira ligação para a loja.
 */
export const STATUS_HINT = {
  awaiting_confirmation: 'Assim que a loja confirmar seu pedido no WhatsApp, o preparo começa.',
  preparing: 'Previsão de entrega: 30 a 45 minutos após a confirmação.',
}

export const PAYMENT_LABEL = {
  // Sem "(na entrega)": quando há chave PIX configurada, a mensagem do
  // WhatsApp manda pagar antes e enviar o comprovante — dizer as duas
  // coisas na mesma tela deixaria o cliente sem saber quando paga.
  pix: 'PIX',
  credit: 'Cartão de crédito (na entrega)',
  debit: 'Cartão de débito (na entrega)',
}
