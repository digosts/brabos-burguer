'use client'

import { useEffect } from 'react'

/**
 * Registra o service worker — é ele que faz o navegador reconhecer o
 * site como aplicativo instalável e permite abrir offline.
 *
 * Em desenvolvimento não registramos, senão o cache atrapalha o
 * hot-reload do Next.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

        // Se já existe uma versão nova esperando, ativa na hora.
        if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING')

        reg.addEventListener('updatefound', () => {
          reg.installing?.addEventListener('statechange', (e) => {
            if (e.target.state === 'installed' && navigator.serviceWorker.controller) {
              e.target.postMessage('SKIP_WAITING')
            }
          })
        })
      } catch (err) {
        console.warn('Service worker não registrado:', err)
      }
    }

    // Espera a página carregar para não competir por banda.
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])

  return null
}
