'use client'

/**
 * Abre o WhatsApp sem nunca deixar uma tela em branco para trás.
 *
 * O jeito antigo era abrir uma aba vazia (`window.open('', '_blank')`) ainda
 * no clique, para escapar do bloqueador de pop-up, e só apontar a URL depois
 * que o pedido voltasse da API. No app instalado (PWA) essa aba vazia vira a
 * tela da frente na hora: se a API demora, se o sistema congela o app em
 * segundo plano ou se a referência da janela se perde, ninguém aponta a URL e
 * o cliente fica olhando um `about:blank` branco.
 *
 * Aqui a aba só nasce quando a URL final já existe — não há intervalo em que
 * exista uma janela sem conteúdo. E há sempre um plano B: se o navegador
 * bloquear o pop-up, a saída é navegar na própria aba, coisa que nenhum
 * navegador bloqueia. Em qualquer caminho o cliente vê uma página de verdade.
 */
export function openWhatsApp(url) {
  if (!url || typeof window === 'undefined') return false

  try {
    const tab = window.open(url, '_blank')
    if (tab) {
      // O wa.me não precisa de referência à nossa janela.
      try {
        tab.opener = null
      } catch {
        // Já virou cross-origin em alguns navegadores. A aba abriu com a URL
        // certa, que é o que importa — a navegação não depende disto.
      }
      return true
    }
  } catch {
    // Há navegador que lança em vez de devolver null ao bloquear o pop-up.
  }

  // Pop-up bloqueado: vai na própria aba. O pedido já está salvo e a tela de
  // pedidos refaz o link, então nada se perde ao sair daqui.
  window.location.href = url
  return true
}
