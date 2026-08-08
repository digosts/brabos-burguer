/* Service worker do PWA — feito à mão, sem workbox.
 *
 * Suba o número da versão para forçar a atualização em quem já instalou.
 */
const VERSION = 'v1'
const STATIC_CACHE = `burger-static-${VERSION}`
const PAGES_CACHE = `burger-pages-${VERSION}`
const DATA_CACHE = `burger-data-${VERSION}`

const PRECACHE = [
  '/offline',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/manifest.webmanifest',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      // addAll falha por inteiro se um item falhar; um a um é mais tolerante.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))))
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = [STATIC_CACHE, PAGES_CACHE, DATA_CACHE]
      const names = await caches.keys()
      await Promise.all(names.filter((n) => !keep.includes(n)).map((n) => caches.delete(n)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

const isStaticAsset = (url) =>
  url.pathname.startsWith('/_next/static/') ||
  url.pathname.startsWith('/icons/') ||
  /\.(?:png|jpg|jpeg|webp|avif|svg|gif|ico|woff2?|ttf)$/i.test(url.pathname)

/** Cache-first: assets com hash no nome nunca mudam de conteúdo. */
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const hit = await cache.match(request)
  if (hit) return hit

  const response = await fetch(request)
  if (response.ok && response.type === 'basic') cache.put(request, response.clone())
  return response
}

/** Network-first: usa a rede e guarda uma cópia para funcionar offline. */
async function networkFirst(request, cacheName, fallback) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (err) {
    const hit = await cache.match(request)
    if (hit) return hit
    if (fallback) {
      const offline = await caches.match(fallback)
      if (offline) return offline
    }
    throw err
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Requisições internas do Next (RSC payload) não devem ser cacheadas:
  // ficariam presas a um build antigo e quebrariam a navegação.
  if (url.searchParams.has('_rsc')) return

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  if (url.pathname.startsWith('/api/')) {
    // Só o menu vale guardar: dá para abrir o app offline e ver os produtos.
    if (url.pathname === '/api/catalog') {
      event.respondWith(networkFirst(request, DATA_CACHE))
    }
    // Login, pedidos e perfil sempre vão à rede.
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGES_CACHE, '/offline'))
  }
})
