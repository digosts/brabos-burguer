import { SHOP } from '@/lib/shop'

/**
 * O Next serve este arquivo em /manifest.webmanifest.
 * É o documento que faz o navegador oferecer "Instalar app" no
 * Android, Windows, macOS, Linux e ChromeOS.
 */
export default function manifest() {
  return {
    name: `${SHOP.name} — Delivery`,
    short_name: SHOP.name,
    description: `Peça seu hambúrguer no ${SHOP.name} e acompanhe o pedido em tempo real.`,
    lang: 'pt-BR',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f0f12',
    theme_color: '#0f0f12',
    categories: ['food', 'shopping', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      // A `/` decide sozinha entre o cardápio aberto e o app de quem tem
      // conta, então serve para os dois casos.
      { name: 'Fazer pedido', url: '/', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Meus pedidos', url: '/meus-pedidos', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  }
}
