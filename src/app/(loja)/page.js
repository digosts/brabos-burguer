import HomeView from '@/components/HomeView'

/**
 * A raiz do site é o cardápio — é também o `start_url` do PWA.
 *
 * Sem título próprio de propósito: o `metadata.title.default` do layout raiz
 * já descreve a loja, e esta é a tela de entrada dela.
 */
export default function CardapioPage() {
  return <HomeView />
}
