'use client'

import { useEffect } from 'react'

/**
 * Trava o zoom no iOS.
 *
 * O Safari ignora `user-scalable=no` desde o iOS 10, então o meta viewport
 * sozinho não resolve. Aqui cobrimos os dois gestos que sobram:
 *
 *  - pinça: eventos `gesture*`, que só existem no WebKit;
 *  - duplo-toque: o CSS já usa `touch-action: manipulation`, mas o Safari
 *    antigo escapa dele, então também barramos o segundo toque rápido.
 *
 * O zoom por multi-toque continua disponível pelos ajustes de acessibilidade
 * do sistema — isso aqui só desliga o gesto dentro da página.
 */
export default function NoZoom() {
  useEffect(() => {
    const block = (e) => e.preventDefault()

    document.addEventListener('gesturestart', block, { passive: false })
    document.addEventListener('gesturechange', block, { passive: false })
    document.addEventListener('gestureend', block, { passive: false })

    let lastTouch = 0
    const blockDoubleTap = (e) => {
      const now = Date.now()
      if (now - lastTouch <= 300) e.preventDefault()
      lastTouch = now
    }
    document.addEventListener('touchend', blockDoubleTap, { passive: false })

    return () => {
      document.removeEventListener('gesturestart', block)
      document.removeEventListener('gesturechange', block)
      document.removeEventListener('gestureend', block)
      document.removeEventListener('touchend', blockDoubleTap)
    }
  }, [])

  return null
}
