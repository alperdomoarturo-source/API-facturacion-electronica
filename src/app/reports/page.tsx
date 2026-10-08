'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { reportService } from '@/services/reportService'

export default function ReportsPage() {
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sales, setSales] = useState({ totalSales: 0, salesCount: 0, salesByMethod: {} as Record<string, number> })
  const [invoices, setInvoices] = useState({ generated: 0, accepted: 0, rejected: 0, pending: 0 })
  const [topProducts, setTopProducts] = useState<Array<{ name: string; quantity: unknown }>>([])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value)

  useEffect(() => {
    if (!isAdmin) return
    const load = async () => {
      try {
        const now = new Date()
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        const [salesStats, invoiceStats, products] = await Promise.all([
          reportService.getSalesStats(monthStart, today),
          reportService.getInvoiceStats(monthStart, today),
          reportService.getTopProducts(monthStart, today),
        ])
        setSales(salesStats)
        setInvoices(invoiceStats)
        setTopProducts(products)
      } catch (err: any) {
        setError(err?.message || 'No se pudieron cargar los reportes')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">Acceso denegado.</div>
      </div>
    )
  }

  if (loading) {
    return <div className="p-8 text-gray-600">Cargando reportes...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes</h1>
      <p className="text-gray-600 mb-8">Resumen del mes en curso</p>
      {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Ventas</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(sales.totalSales)}</p>
          <p className="text-sm text-gray-500 mt-1">{sales.salesCount} transacciones</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Facturas</p>
          <p className="text-2xl font-bold mt-2">{invoices.generated}</p>
          <p className="text-sm text-gray-500 mt-1">{invoices.accepted} aceptadas / {invoices.rejected} rechazadas</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Pendientes DIAN</p>
          <p className="text-2xl font-bold mt-2">{invoices.pending}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Productos más vendidos</h2>
        {topProducts.length === 0 ? (
          <p className="text-gray-500">Aún no hay productos vendidos.</p>
        ) : (
          <ul className="divide-y">
            {topProducts.map((item) => (
              <li key={item.name} className="py-3 flex justify-between">
                <span>{item.name}</span>
                <span className="font-medium">{String(item.quantity)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
