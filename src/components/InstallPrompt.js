'use client'

import { useInstall } from '@/context/InstallContext'
import Sheet from './Sheet'
import { IconDownload, IconMore, IconShareIos, IconX } from './Icons'

/** Passo a passo de instalação por plataforma. */
const GUIDES = {
  'ios-safari': {
    title: 'Instalar no iPhone / iPad',
    steps: [
      <>
        Toque no botão <b>Compartilhar</b>
        <span className="ios-share">
          <IconShareIos size={14} />
        </span>
        na barra do Safari.
      </>,
      <>
        Role a lista e escolha <b>Adicionar à Tela de Início</b>.
      </>,
      <>
        Confirme em <b>Adicionar</b>. O app aparece na sua tela inicial como
        qualquer outro aplicativo.
      </>,
    ],
  },
  'ios-other': {
    title: 'Instalar no iPhone / iPad',
    steps: [
      <>
        No iOS, a instalação acontece pelo menu <b>Compartilhar</b> do navegador.
      </>,
      <>
        Toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.
      </>,
      <>
        Se a opção não aparecer, abra este site no <b>Safari</b> e repita — é o
        navegador com melhor suporte no iOS.
      </>,
    ],
  },
  android: {
    title: 'Instalar no Android',
    steps: [
      <>
        Toque no menu
        <span className="ios-share">
          <IconMore size={14} />
        </span>
        no canto do navegador.
      </>,
      <>
        Escolha <b>Instalar aplicativo</b> (ou <b>Adicionar à tela inicial</b>).
      </>,
      <>
        Confirme em <b>Instalar</b>.
      </>,
    ],
  },
  'android-firefox': {
    title: 'Instalar no Android (Firefox)',
    steps: [
      <>
        Toque no menu
        <span className="ios-share">
          <IconMore size={14} />
        </span>
        do Firefox.
      </>,
      <>
        Escolha <b>Instalar</b> ou <b>Adicionar à tela inicial</b>.
      </>,
      <>
        Confirme. Para a melhor experiência, o Chrome também funciona.
      </>,
    ],
  },
  'desktop-chromium': {
    title: 'Instalar no computador',
    steps: [
      <>
        Clique no ícone de <b>instalar</b>
        <span className="ios-share">
          <IconDownload size={14} />
        </span>
        no lado direito da barra de endereço.
      </>,
      <>
        Ou abra o menu <b>⋮</b> → <b>Salvar e compartilhar</b> →{' '}
        <b>Instalar página como app</b>.
      </>,
      <>
        O app abre em janela própria e ganha atalho na área de trabalho.
      </>,
    ],
  },
  'desktop-safari': {
    title: 'Instalar no Mac (Safari)',
    steps: [
      <>
        Com o site aberto, clique em <b>Arquivo</b> na barra de menus.
      </>,
      <>
        Escolha <b>Adicionar ao Dock…</b>
      </>,
      <>
        Confirme em <b>Adicionar</b>. Requer macOS Sonoma ou superior.
      </>,
    ],
  },
  'desktop-firefox': {
    title: 'Instalar no computador',
    steps: [
      <>
        O Firefox para desktop ainda não instala aplicativos web.
      </>,
      <>
        Abra este site no <b>Chrome</b>, <b>Edge</b> ou <b>Brave</b> e o botão de
        instalar aparece na barra de endereço.
      </>,
      <>
        Enquanto isso, você pode usar o app normalmente pelo navegador.
      </>,
    ],
  },
  unknown: {
    title: 'Instalar o aplicativo',
    steps: [
      <>
        Procure a opção <b>Instalar aplicativo</b> ou{' '}
        <b>Adicionar à tela inicial</b> no menu do seu navegador.
      </>,
      <>
        No computador, o ícone de instalar costuma ficar na barra de endereço.
      </>,
      <>
        Em último caso, use o Chrome (Android/desktop) ou o Safari (iPhone).
      </>,
    ],
  },
}

export default function InstallPrompt() {
  const { installed, showBanner, showGuide, closeGuide, dismissBanner, promptInstall, platform } =
    useInstall()

  if (installed) return null

  const guide = GUIDES[platform] || GUIDES.unknown

  return (
    <>
      {showBanner ? (
        <div className="install-bar" role="region" aria-label="Instalar aplicativo">
          <button className="install-close" onClick={dismissBanner} aria-label="Agora não">
            <IconX size={14} />
          </button>

          <img src="/icons/icon-192.png" alt="" width={42} height={42} />

          <div className="install-bar-body">
            <strong>Instale o app</strong>
            <span>Pedidos mais rápidos, direto da sua tela inicial.</span>
          </div>

          <button className="btn btn-primary btn-sm" onClick={promptInstall}>
            <IconDownload size={16} />
            Instalar
          </button>
        </div>
      ) : null}

      <Sheet
        open={showGuide}
        onClose={closeGuide}
        title={guide.title}
        subtitle="Leva menos de 10 segundos"
      >
        <div className="steps">
          {guide.steps.map((step, i) => (
            <div className="step" key={i}>
              <span className="step-num">{i + 1}</span>
              <div className="step-body">{step}</div>
            </div>
          ))}
        </div>

        <p className="text-mute" style={{ fontSize: 12.5, marginTop: 6 }}>
          O app instalado funciona em tela cheia, abre mais rápido e mantém seu
          carrinho salvo.
        </p>

        <button className="btn btn-ghost btn-block" onClick={closeGuide} style={{ marginTop: 16 }}>
          Entendi
        </button>
      </Sheet>
    </>
  )
}
