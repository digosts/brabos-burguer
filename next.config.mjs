/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Permite rodar um `build` sem derrubar o `dev` que estiver aberto.
   *
   * Os dois escrevem em `.next` e, disputando a pasta, o build quebra em
   * "Cannot find module for page" — erro que parece bug no código e não é.
   * Com `NEXT_DIST_DIR=.next-build npm run build` cada um fica no seu canto.
   * Sem a variável, nada muda.
   */
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // As imagens dos produtos vêm de URLs que você cola no MongoDB.
  // `unoptimized` evita a dependência do sharp e libera qualquer host.
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },

  async headers() {
    return [
      {
        /**
         * Headers de segurança do site inteiro.
         *
         * Não há CSP aqui de propósito: o Next injeta script e style inline em
         * toda página, então uma CSP restritiva quebraria o app e uma
         * permissiva (`unsafe-inline`) não protegeria de nada. Fazer certo
         * exige nonce por requisição via middleware — vale a pena, mas é uma
         * mudança à parte, não um header a mais nesta lista.
         */
        source: '/:path*',
        headers: [
          // A loja nunca é legitimamente carregada dentro de um iframe.
          // Sem isto, um site hostil embute o painel numa página transparente
          // e induz o admin a clicar em "Entregue" sem ver o que clicou.
          { key: 'X-Frame-Options', value: 'DENY' },
          // Impede o navegador de "adivinhar" o tipo de um arquivo servido —
          // é o que transforma um upload inofensivo em script executável.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // O caminho pode conter o token de redefinição de senha. Sem esta
          // regra, o navegador o mandaria no `Referer` ao carregar qualquer
          // imagem externa da página.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // Só tem efeito sob HTTPS; em localhost o navegador ignora.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
      {
        // O service worker precisa ser servido sem cache para que
        // atualizações do app cheguem ao usuário já instalado.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [{ key: 'Content-Type', value: 'application/manifest+json' }],
      },
    ]
  },
}

export default nextConfig
