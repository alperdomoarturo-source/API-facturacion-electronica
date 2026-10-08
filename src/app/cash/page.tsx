'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { cashService } from '@/services/cashService'
import { CashRegister, CashMovement } from '@/types'
import { DollarSign, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Clock, User } from 'lucide-react'

export default function CashPage() {
  const { isAdmin, isCashier, profile, loading: authLoading } = useAuth()
  const [openRegister, setOpenRegister] = useState<CashRegister | null>(null)
  const [registerHistory, setRegisterHistory] = useState<CashRegister[]>([])
  const [loading, setLoading] = useState(true)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [openingAmount, setOpeningAmount] = useState(0)
  const [closingAmount, setClosingAmount] = useState(0)
  const [movement, setMovement] = useState({ type: 'entry' as 'entry' | 'exit', amount: 0, reason: '' })
  const [registerSummary, setRegisterSummary] = useState<any>(null)

  useEffect(() => {
    if (authLoading) return
    if (!profile?.user_id) {
      setLoading(false)
      return
    }
    fetchData()
  }, [profile?.user_id, authLoading])

  const fetchData = async () => {
    try {
      const [open, history] = await Promise.all([
        cashService.getOpenCashRegister(profile?.user_id || ''),
        cashService.getCashRegisters(profile?.user_id),
      ])
      setOpenRegister(open)
      setRegisterHistory(history)
      
      if (open) {
        const summary = await cashService.getCashRegisterSummary(open.id)
        setRegisterSummary(summary)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenRegister = async () => {
    try {
      await cashService.openCashRegister(profile?.user_id || '', openingAmount)
      setShowOpenModal(false)
      setOpeningAmount(0)
      fetchData()
    } catch (error: any) {
      alert(error.message || 'Error al abrir caja')
    }
  }

  const handleCloseRegister = async () => {
    if (!openRegister) return
    try {
      await cashService.closeCashRegister(openRegister.id, closingAmount, profile?.user_id || '')
      setShowCloseModal(false)
      setClosingAmount(0)
      fetchData()
    } catch (error: any) {
      alert(error.message || 'Error al cerrar caja')
    }
  }

  const handleAddMovement = async () => {
    if (!openRegister) return
    try {
      await cashService.addCashMovement(
        openRegister.id,
        movement.type,
        movement.amount,
        movement.reason,
        profile?.user_id || ''
      )
      setShowMovementModal(false)
      setMovement({ type: 'entry', amount: 0, reason: '' })
      fetchData()
    } catch (error: any) {
      alert(error.message || 'Error al registrar movimiento')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value)
  }

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Caja</h1>
          <p className="text-gray-600 mt-2">Gestión de caja y movimientos</p>
        </div>
        {!openRegister && (
          <button
            onClick={() => setShowOpenModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <DollarSign className="w-5 h-5" />
            <span>Abrir Caja</span>
          </button>
        )}
      </div>

      {/* Open Register Status */}
      {openRegister ? (
        <div className="space-y-6">
          {/* Current Register Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Caja Abierta</h2>
                  <p className="text-sm text-gray-500">Apertura: {new Date(openRegister.opening_date).toLocaleString('es-CO')}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Activa
              </span>
            </div>

            {registerSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Saldo Inicial</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(openRegister.opening_amount)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Ventas Efectivo</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(registerSummary.paymentTotals.cash)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Entradas</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(registerSummary.entries)}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Salidas</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(registerSummary.exits)}</p>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowMovementModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowUpCircle className="w-5 h-5" />
                <span>Registrar Movimiento</span>
              </button>
              <button
                onClick={() => setShowCloseModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Clock className="w-5 h-5" />
                <span>Cerrar Caja</span>
              </button>
            </div>
          </div>

          {/* Payment Methods Summary */}
          {registerSummary && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen por Método de Pago</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Efectivo</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(registerSummary.paymentTotals.cash)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Tarjeta Débito</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(registerSummary.paymentTotals.debit_card)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Tarjeta Crédito</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(registerSummary.paymentTotals.credit_card)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Transferencia</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(registerSummary.paymentTotals.transfer)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Nequi</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(registerSummary.paymentTotals.nequi)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Otros</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(registerSummary.paymentTotals.other)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Movements */}
          {registerSummary && registerSummary.movements && registerSummary.movements.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Movimientos Recientes</h3>
              <div className="space-y-3">
                {registerSummary.movements.map((movement: CashMovement) => (
                  <div key={movement.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      {movement.type === 'entry' ? (
                        <ArrowUpCircle className="w-5 h-5 text-green-600 mr-3" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-red-600 mr-3" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{movement.reason || 'Sin motivo'}</p>
                        <p className="text-sm text-gray-500">{new Date(movement.created_at).toLocaleString('es-CO')}</p>
                      </div>
                    </div>
                    <span className={`font-bold ${
                      movement.type === 'entry' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.type === 'entry' ? '+' : '-'}{formatCurrency(movement.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay caja abierta</h3>
          <p className="text-gray-600 mb-4">Abre una caja para comenzar a operar</p>
          <button
            onClick={() => setShowOpenModal(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <DollarSign className="w-5 h-5" />
            <span>Abrir Caja</span>
          </button>
        </div>
      )}

      {/* Register History */}
      {registerHistory.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Cajas</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Apertura</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Cierre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo Inicial</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo Final</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diferencia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registerHistory.map((register) => (
                  <tr key={register.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(register.opening_date).toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {register.closing_date ? new Date(register.closing_date).toLocaleString('es-CO') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatCurrency(register.opening_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {register.closing_amount ? formatCurrency(register.closing_amount) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {register.difference !== undefined && (
                        <span className={`font-medium ${
                          register.difference === 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {register.difference === 0 ? '✓ Cuadrada' : formatCurrency(register.difference)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        register.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {register.status === 'open' ? 'Abierta' : 'Cerrada'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Open Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Abrir Caja</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Efectivo Inicial
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleOpenRegister}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Abrir Caja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {showCloseModal && openRegister && registerSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Cerrar Caja</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Efectivo esperado:</span>
                  <span className="font-bold">{formatCurrency(registerSummary.totalExpected)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tarjetas:</span>
                  <span className="font-bold">{formatCurrency(registerSummary.paymentTotals.debit_card + registerSummary.paymentTotals.credit_card)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transferencias:</span>
                  <span className="font-bold">{formatCurrency(registerSummary.paymentTotals.transfer)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nequi:</span>
                  <span className="font-bold">{formatCurrency(registerSummary.paymentTotals.nequi)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Efectivo Contado
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              {closingAmount > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Diferencia:</span>
                    <span className={`text-xl font-bold ${
                      (closingAmount - registerSummary.totalExpected) === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(closingAmount - registerSummary.totalExpected)}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCloseRegister}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirmar Cierre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Registrar Movimiento</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={movement.type}
                  onChange={(e) => setMovement({ ...movement, type: e.target.value as 'entry' | 'exit' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="entry">Entrada</option>
                  <option value="exit">Salida</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={movement.amount}
                  onChange={(e) => setMovement({ ...movement, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo
                </label>
                <input
                  type="text"
                  value={movement.reason}
                  onChange={(e) => setMovement({ ...movement, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del movimiento"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddMovement}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
