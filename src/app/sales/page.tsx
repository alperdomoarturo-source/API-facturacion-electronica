'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { salesService } from '@/services/salesService'
import { invoiceService } from '@/services/invoiceService'
import { Sale } from '@/types'
import { Receipt, Search, Ban, RefreshCcw, FileText } from 'lucide-react'

type SaleRow = Sale & {
  customers?: { name?: string; document_number?: string } | null
  sale_items?: Array<{
    quantity: number
    total: number
    products?: { name?: string } | null
  }>
}

const paymentLabels: Record<Sale['payment_method'], string> = {
  cash: 'Efectivo',
  debit_card: 'Débito',
  credit_card: 'Tarjeta',
  transfer: 'Transferencia',
  nequi: 'Nequi',
  other: 'Otro',
}

const statusLabels: Record<Sale['status'], string> = {
  completed: 'Completada',
  cancelled: 'Anulada',
  refunded: 'Reembolsada',
}

export default function SalesPage() {
  const { isAdmin, isCashier, user } = useAuth()
  const [sales, setSales] = useState<SaleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      setError('')
      const data = await salesService.getSales()
      setSales((data || []) as SaleRow[])
    } catch (err: any) {
      console.error('Error fetching sales:', err)
      setError(err?.message || 'No se pudieron cargar las ventas.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const handleCancel = async (sale: SaleRow) => {
    if (!user || sale.status !== 'completed') return
    if (!confirm('¿Anular esta venta?')) return
    try {
      await salesService.cancelSale(sale.id, user.id)
      fetchSales()
    } catch (err: any) {
      alert(err?.message || 'No se pudo anular la venta')
    }
  }

  const handleRefund = async (sale: SaleRow) => {
    if (!user || sale.status !== 'completed') return
    const reason = prompt('Motivo del reembolso')
    if (!reason) return
    try {
      await salesService.refundSale(sale.id, reason, user.id)
      fetchSales()
    } catch (err: any) {
      alert(err?.message || 'No se pudo reembolsar la venta')
    }
  }

  const handleInvoice = async (sale: SaleRow) => {
    if (!sale.customer_id) {
      alert('Esta venta no tiene cliente. Cobra de nuevo con Facturar o asocia un cliente.')
      return
    }
    try {
      await invoiceService.createInvoice(sale.id, sale.customer_id, user?.id || '')
      alert('Factura generada. Revísala en Facturación.')
    } catch (err: any) {
      alert(err?.message || 'No se pudo generar la factura')
    }
  }

  const filteredSales = sales.filter((sale) => {
    const customerName = sale.customers?.name?.toLowerCase() || ''
    const query = searchQuery.toLowerCase()
    return (
      sale.id.toLowerCase().includes(query) ||
      customerName.includes(query) ||
      paymentLabels[sale.payment_method]?.toLowerCase().includes(query)
    )
  })

  if (!isAdmin && !isCashier) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Acceso denegado.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
        <p className="text-gray-600 mt-2">Consulta y gestiona las ventas del POS</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por cliente o medio de pago..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSales.map((sale) => (
              <tr key={sale.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(sale.created_at).toLocaleString('es-CO')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.customers?.name || 'Cliente ocasional'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {(sale.sale_items || [])
                    .map((item) => `${item.quantity}x ${item.products?.name || 'Producto'}`)
                    .join(', ') || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {paymentLabels[sale.payment_method] || sale.payment_method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {formatCurrency(Number(sale.total || 0))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {statusLabels[sale.status] || sale.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      onClick={() => handleInvoice(sale)}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                      title="Generar factura"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    {isAdmin && sale.status === 'completed' && (
                      <>
                        <button
                          onClick={() => handleCancel(sale)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Anular"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRefund(sale)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Reembolsar"
                        >
                          <RefreshCcw className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSales.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay ventas registradas</p>
          </div>
        )}
      </div>
    </div>
  )
}
