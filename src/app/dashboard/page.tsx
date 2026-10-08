'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { reportService } from '@/services/reportService'
import StatCard from '@/components/dashboard/StatCard'
import {
  DollarSign,
  Receipt,
  CheckCircle,
  XCircle,
  Package,
  TrendingDown,
  TrendingUp,
  FileText
} from 'lucide-react'

export default function DashboardPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({
    todaySales: 0,
    monthSales: 0,
    invoicesGenerated: 0,
    invoicesAccepted: 0,
    invoicesRejected: 0,
    inventoryValue: 0,
    expenses: 0,
    estimatedProfit: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) return

    const fetchStats = async () => {
      try {
        const now = new Date()
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

        const [salesStats, invoiceStats, inventoryStats, financialStats] = await Promise.all([
          reportService.getSalesStats(today, today),
          reportService.getInvoiceStats(today, today),
          reportService.getInventoryStats(),
          reportService.getFinancialStats(monthStart, today),
        ])

        const monthSalesData = await reportService.getSalesStats(monthStart, today)

        setStats({
          todaySales: salesStats.totalSales,
          monthSales: monthSalesData.totalSales,
          invoicesGenerated: invoiceStats.generated,
          invoicesAccepted: invoiceStats.accepted,
          invoicesRejected: invoiceStats.rejected,
          inventoryValue: inventoryStats.totalValue,
          expenses: financialStats.totalExpenses,
          estimatedProfit: financialStats.estimatedProfit,
          accountsReceivable: financialStats.totalReceivable,
          accountsPayable: financialStats.totalPayable,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [isAdmin])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value)
  }

  if (authLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Acceso denegado. Solo los administradores pueden ver el dashboard.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Resumen general del restaurante</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Ventas del día"
          value={formatCurrency(stats.todaySales)}
          icon={DollarSign}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Ventas del mes"
          value={formatCurrency(stats.monthSales)}
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Facturas generadas"
          value={stats.invoicesGenerated}
          icon={Receipt}
        />
        <StatCard
          title="Facturas aceptadas"
          value={stats.invoicesAccepted}
          icon={CheckCircle}
        />
        <StatCard
          title="Facturas rechazadas"
          value={stats.invoicesRejected}
          icon={XCircle}
        />
        <StatCard
          title="Valor inventario"
          value={formatCurrency(stats.inventoryValue)}
          icon={Package}
        />
        <StatCard
          title="Gastos del mes"
          value={formatCurrency(stats.expenses)}
          icon={TrendingDown}
        />
        <StatCard
          title="Utilidad estimada"
          value={formatCurrency(stats.estimatedProfit)}
          icon={TrendingUp}
          trend={{ value: 15, isPositive: stats.estimatedProfit >= 0 }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cuentas por cobrar</h3>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.accountsReceivable)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cuentas por pagar</h3>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.accountsPayable)}</p>
        </div>
      </div>
    </div>
  )
}
