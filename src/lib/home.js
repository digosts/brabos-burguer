/**
 * Tela inicial de cada papel.
 *
 * O admin cai direto na gestão: ele não compra, despacha. Mandá-lo para o
 * cardápio custava um toque a mais em toda entrada, justamente no momento em
 * que ele quer ver a fila.
 *
 * Fica num arquivo só porque o mesmo destino é decidido em quatro lugares —
 * o formulário de login, o de redefinição de senha e os dois layouts que
 * redirecionam quem já está logado. Espalhado, um deles fatalmente ficaria
 * para trás.
 */
export const HOME_ADMIN = '/admin/pedidos'
export const HOME_CUSTOMER = '/inicio'

/** Aceita tanto o documento do Mongo (`role`) quanto o objeto público (`isAdmin`). */
export function homePathFor(user) {
  return user?.isAdmin || user?.role === 'admin' ? HOME_ADMIN : HOME_CUSTOMER
}
