'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { reportService } from '@/services/reportService'

export default function AccountingPage() {
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalPurchases: 0,
    totalReceivable: 0,
    totalPayable: 0,
    estimatedProfit: 0,
  })

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value)

  useEffect(() => {
    if (!isAdmin) return
    const load = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
        const data = await reportService.getFinancialStats(monthStart, today)
        setStats(data)
      } catch (err: any) {
        setError(err?.message || 'No se pudo cargar la contabilidad')
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

  if (loading) return <div className="p-8 text-gray-600">Cargando contabilidad...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Contabilidad</h1>
      <p className="text-gray-600 mb-8">Estado financiero del mes</p>
      {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Ingresos</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Gastos</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalExpenses)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Compras</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalPurchases)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Cuentas por cobrar</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalReceivable)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Cuentas por pagar</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalPayable)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Utilidad estimada</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(stats.estimatedProfit)}</p>
        </div>
      </div>
    </div>
  )
}
