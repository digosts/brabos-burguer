import AdminOrdersView from '@/components/AdminOrdersView'

export const metadata = { title: 'Pedidos entregues' }

export default function AdminDeliveredOrdersPage() {
  return <AdminOrdersView scope="delivered" />
}
