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
