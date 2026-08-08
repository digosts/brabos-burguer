import './globals.css'
import { SHOP } from '@/lib/shop'
import { InstallProvider } from '@/context/InstallContext'
import InstallPrompt from '@/components/InstallPrompt'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata = {
  title: {
    default: `${SHOP.name} — Delivery de hambúrguer`,
    template: `%s · ${SHOP.name}`,
  },
  description: `Monte seu pedido no ${SHOP.name}, pague na entrega e acompanhe o status em tempo real.`,
  applicationName: SHOP.name,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: SHOP.name,
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
  formatDetection: { telephone: false },
  other: {
    // Mantém o app em tela cheia quando instalado no Android antigo.
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport = {
  themeColor: '#0f0f12',
  width: 'device-width',
  initialScale: 1,
  // Faz o conteúdo ocupar a área do notch; o CSS usa env(safe-area-inset-*).
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <InstallProvider>
          {children}
          <InstallPrompt />
        </InstallProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
