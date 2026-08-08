'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const InstallContext = createContext(null)

const DISMISS_KEY = 'burger.install.dismissed'
const SNOOZE_MS = 1000 * 60 * 60 * 24 * 5 // 5 dias

/** Descobre em qual plataforma/navegador estamos para dar a instrução certa. */
function detectPlatform() {
  if (typeof navigator === 'undefined') return 'unknown'

  const ua = navigator.userAgent
  const isIpadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  const isIOS = /iPad|iPhone|iPod/.test(ua) || isIpadOS
  const isAndroid = /Android/i.test(ua)
  const isFirefox = /Firefox|FxiOS/i.test(ua)
  const isChromium = /Chrome|Chromium|CriOS|Edg|EdgiOS|SamsungBrowser|OPR/i.test(ua)
  const isSafari = /Safari/i.test(ua) && !isChromium && !isFirefox

  if (isIOS) return isSafari ? 'ios-safari' : 'ios-other'
  if (isAndroid) return isFirefox ? 'android-firefox' : 'android'
  if (isFirefox) return 'desktop-firefox'
  if (isSafari) return 'desktop-safari'
  if (isChromium) return 'desktop-chromium'
  return 'unknown'
}

function isRunningStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: window-controls-overlay)').matches ||
    // iOS usa uma propriedade própria em vez do display-mode.
    window.navigator.standalone === true
  )
}

export function InstallProvider({ children }) {
  const [platform, setPlatform] = useState('unknown')
  const [installed, setInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    setPlatform(detectPlatform())
    setInstalled(isRunningStandalone())

    // O navegador dispara este evento quando o app é instalável.
    // Guardar o evento permite abrir o diálogo nativo quando quisermos.
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
      setShowBanner(false)
      setShowGuide(false)
    }

    // Cobre o caso de o app ser aberto na aba e instalado depois.
    const mq = window.matchMedia('(display-mode: standalone)')
    const onDisplayChange = (e) => setInstalled(e.matches)

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    mq.addEventListener?.('change', onDisplayChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      mq.removeEventListener?.('change', onDisplayChange)
    }
  }, [])

  // Aparece só depois de alguns segundos: não atropela o primeiro contato.
  useEffect(() => {
    if (installed) return

    let dismissedAt = 0
    try {
      dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
    } catch {
      /* ignorar */
    }
    if (Date.now() - dismissedAt < SNOOZE_MS) return

    const t = setTimeout(() => setShowBanner(true), 3500)
    return () => clearTimeout(t)
  }, [installed, deferredPrompt, platform])

  const dismissBanner = useCallback(() => {
    setShowBanner(false)
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* ignorar */
    }
  }, [])

  /**
   * Abre o diálogo nativo quando existe; senão mostra o passo a passo
   * da plataforma (iOS e Firefox não expõem API de instalação).
   */
  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      // O evento só pode ser usado uma vez.
      setDeferredPrompt(null)
      if (outcome === 'accepted') {
        setShowBanner(false)
        return 'accepted'
      }
      dismissBanner()
      return 'dismissed'
    }

    setShowGuide(true)
    return 'guide'
  }, [deferredPrompt, dismissBanner])

  return (
    <InstallContext.Provider
      value={{
        platform,
        installed,
        canPromptNatively: Boolean(deferredPrompt),
        showBanner: showBanner && !installed,
        showGuide,
        openGuide: () => setShowGuide(true),
        closeGuide: () => setShowGuide(false),
        dismissBanner,
        promptInstall,
      }}
    >
      {children}
    </InstallContext.Provider>
  )
}

export function useInstall() {
  const ctx = useContext(InstallContext)
  if (!ctx) throw new Error('useInstall precisa estar dentro de <InstallProvider>')
  return ctx
}
