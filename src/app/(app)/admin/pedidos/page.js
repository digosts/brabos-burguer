import AdminOrdersView from '@/components/AdminOrdersView'

export const metadata = { title: 'Pedidos da loja' }

export default function AdminActiveOrdersPage() {
  return <AdminOrdersView scope="active" />
}
