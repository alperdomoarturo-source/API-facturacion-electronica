'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { purchaseService } from '@/services/purchaseService'
import { supplierService } from '@/services/supplierService'
import { inventoryService } from '@/services/inventoryService'
import { Purchase, Supplier, Ingredient } from '@/types'
import { Plus, Search, ShoppingCart, Trash2, DollarSign } from 'lucide-react'

export default function PurchasesPage() {
  const { isAdmin, profile } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [purchaseItems, setPurchaseItems] = useState<any[]>([])
  const [newItem, setNewItem] = useState({ ingredient_id: '', quantity: 0, unit_price: 0 })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [purchasesData, suppliersData, ingredientsData] = await Promise.all([
        purchaseService.getPurchases(),
        supplierService.getSuppliers(),
        inventoryService.getIngredients(),
      ])
      setPurchases(purchasesData)
      setSuppliers(suppliersData)
      setIngredients(ingredientsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addPurchaseItem = () => {
    if (newItem.ingredient_id && newItem.quantity > 0 && newItem.unit_price > 0) {
      const ingredient = ingredients.find((i) => i.id === newItem.ingredient_id)
      const total = newItem.quantity * newItem.unit_price
      setPurchaseItems([...purchaseItems, { ...newItem, total, ingredient }])
      setNewItem({ ingredient_id: '', quantity: 0, unit_price: 0 })
    }
  }

  const removePurchaseItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return purchaseItems.reduce((sum, item) => sum + item.total, 0)
  }

  const handleCreatePurchase = async () => {
    if (!selectedSupplier || purchaseItems.length === 0) {
      alert('Selecciona un proveedor y agrega al menos un ingrediente')
      return
    }

    try {
      const items = purchaseItems.map((item) => ({
        ingredient_id: item.ingredient_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }))

      await purchaseService.createPurchase(
        selectedSupplier.id,
        items,
        profile?.user_id || ''
      )

      setShowModal(false)
      setSelectedSupplier(null)
      setPurchaseItems([])
      setNewItem({ ingredient_id: '', quantity: 0, unit_price: 0 })
      fetchData()
    } catch (error) {
      console.error('Error creating purchase:', error)
      alert('Error al crear la compra')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value)
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Acceso denegado. Solo los administradores pueden gestionar compras.
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
          <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
          <p className="text-gray-600 mt-2">Gestiona las compras a proveedores</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Compra</span>
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Proveedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {purchases.map((purchase) => {
              const supplier = suppliers.find((s) => s.id === purchase.supplier_id)
              return (
                <tr key={purchase.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {supplier?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(purchase.created_at).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(purchase.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      purchase.status === 'received'
                        ? 'bg-green-100 text-green-800'
                        : purchase.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {purchase.status === 'received' ? 'Recibida' : purchase.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Nueva Compra</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Supplier Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <select
                  required
                  value={selectedSupplier?.id || ''}
                  onChange={(e) => {
                    const supplier = suppliers.find((s) => s.id === e.target.value)
                    setSelectedSupplier(supplier || null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Items */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Ingredientes</h3>
                <div className="flex space-x-2 mb-4">
                  <select
                    value={newItem.ingredient_id}
                    onChange={(e) => setNewItem({ ...newItem, ingredient_id: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar ingrediente</option>
                    {ingredients.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name} ({ingredient.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Cantidad"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Precio unitario"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                    className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addPurchaseItem}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  {purchaseItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{item.ingredient?.name}</span>
                        <span className="text-gray-600 ml-2">
                          {item.quantity} {item.ingredient?.unit} x {formatCurrency(item.unit_price)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-bold text-gray-900">{formatCurrency(item.total)}</span>
                        <button
                          type="button"
                          onClick={() => removePurchaseItem(index)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-900">Total de compra:</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedSupplier(null)
                    setPurchaseItems([])
                    setNewItem({ ingredient_id: '', quantity: 0, unit_price: 0 })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePurchase}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Compra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
