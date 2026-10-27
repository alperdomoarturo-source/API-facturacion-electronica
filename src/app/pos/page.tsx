'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { productService } from '@/services/productService'
import { customerService } from '@/services/customerService'
import { salesService } from '@/services/salesService'
import { invoiceService } from '@/services/invoiceService'
import { cashService } from '@/services/cashService'
import { CartItem, Product, Customer, Category, Sale } from '@/types'
import { ShoppingCart, Search, Plus, Minus, CreditCard, DollarSign, Smartphone, FileText, X } from 'lucide-react'

const PAYMENT_LABELS: Record<Sale['payment_method'], string> = {
  cash: 'Efectivo',
  debit_card: 'Tarjeta débito',
  credit_card: 'Tarjeta crédito',
  transfer: 'Transferencia',
  nequi: 'Nequi',
  other: 'Otro',
}

const BILL_DENOMINATIONS = [1000, 2000, 5000, 10000, 20000, 50000, 100000]

export default function POSPage() {
  const { isAdmin, isCashier, user, loading: authLoading } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [checkout, setCheckout] = useState<{
    method: Sale['payment_method']
    generateInvoice: boolean
  } | null>(null)
  const [received, setReceived] = useState(0)

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          productService.getProducts(),
          productService.getCategories(),
        ])
        setProducts((productsData || []).filter((product: Product) => product.active !== false))
        setCategories(categoriesData || [])
      } catch (error) {
        console.error('Error loading POS catalog:', error)
        setMessage({ type: 'error', text: 'No se pudieron cargar los productos del menú.' })
      } finally {
        setLoading(false)
      }
    }

    loadCatalog()
  }, [])

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const cartGrandTotal = cartTotal

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleCustomerSearch = async (query: string) => {
    setCustomerSearch(query)
    if (query.length >= 2) {
      try {
        const results = await customerService.searchCustomers(query)
        setCustomerResults(results || [])
      } catch (error) {
        console.error('Error searching customers:', error)
      }
    } else {
      setCustomerResults([])
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const changeDue = Math.max(received - cartGrandTotal, 0)
  const missingAmount = Math.max(cartGrandTotal - received, 0)
  const isCashCheckout = checkout?.method === 'cash'

  const openCheckout = (method: Sale['payment_method'], generateInvoice: boolean) => {
    if (cart.length === 0) {
      setMessage({ type: 'error', text: 'Agrega productos al carrito antes de cobrar.' })
      return
    }

    if (!user) {
      setMessage({ type: 'error', text: 'No hay una sesión válida para registrar la venta.' })
      return
    }

    setReceived(0)
    setMessage(null)
    setCheckout({ method, generateInvoice })
  }

  const handleCheckout = async () => {
    if (!checkout || !user || cart.length === 0) return

    const paymentMethod = checkout.method
    const generateInvoice = checkout.generateInvoice

    setProcessing(true)
    setMessage(null)

    try {
      let customer = selectedCustomer
      if (generateInvoice && !customer) {
        const walkIn = await customerService.findOrCreateWalkInCustomer()
        if (!walkIn) {
          throw new Error('No se pudo crear el cliente de consumo final.')
        }
        customer = walkIn
        setSelectedCustomer(walkIn)
        setCustomerSearch(walkIn.name)
      }

      let openRegister = null
      try {
        openRegister = await cashService.getOpenCashRegister(user.id)
      } catch (error) {
        console.warn('No open cash register:', error)
      }

      const sale = await salesService.createSale(
        cart,
        paymentMethod,
        user.id,
        customer?.id,
        openRegister?.id
      )

      if (generateInvoice) {
        if (!customer) {
          throw new Error('No se pudo asociar un cliente a la factura.')
        }
        await invoiceService.createInvoice(sale.id, customer.id, user.id)
      }

      const change = Math.max(received - Number(sale.total), 0)

      if (paymentMethod === 'cash' && received > 0) {
        // El dinero que queda en el cajón es el total de la venta; la devuelta
        // se guarda en la referencia del pago para poder auditarla.
        salesService
          .recordPayment(
            sale.id,
            Number(sale.total),
            paymentMethod,
            `Recibido ${formatCurrency(received)} · Devuelta ${formatCurrency(change)}`
          )
          .catch((error) => console.error('Error registrando el pago:', error))
      }

      setCart([])
      setCheckout(null)
      setMessage({
        type: 'success',
        text: `${generateInvoice ? 'Venta registrada y factura generada' : 'Venta registrada'} por ${formatCurrency(
          Number(sale.total)
        )}${paymentMethod === 'cash' && received > 0 ? ` · Devuelta ${formatCurrency(change)}` : ''}.`,
      })
    } catch (error: any) {
      console.error('Error processing sale:', error)
      setMessage({
        type: 'error',
        text: error?.message || 'No se pudo completar la venta.',
      })
    } finally {
      setProcessing(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
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

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-white border-b">
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-16">
              <p>No hay productos activos. Créalos en Menú para vender desde el POS.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={processing}
                  className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left disabled:opacity-50"
                >
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-sm">Sin imagen</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-blue-600 font-bold mt-1">{formatCurrency(product.price)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-96 bg-white border-l flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <ShoppingCart className="w-6 h-6 mr-2" />
            Carrito
          </h2>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={customerSearch}
              onChange={(e) => handleCustomerSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {customerResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {customerResults.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer)
                      setCustomerSearch(customer.name)
                      setCustomerResults([])
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    {customer.name} - {customer.document_number}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedCustomer && (
            <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
              <span>Cliente: {selectedCustomer.name}</span>
              <button
                onClick={() => {
                  setSelectedCustomer(null)
                  setCustomerSearch('')
                }}
                className="text-red-600 hover:underline"
              >
                Quitar
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                    <p className="text-sm text-gray-600">{formatCurrency(item.product.price)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="font-semibold text-gray-900 ml-4">
                    {formatCurrency(item.product.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          {message && (
            <div
              className={`mb-3 px-3 py-2 rounded text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(cartGrandTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              disabled={processing}
              onClick={() => openCheckout('cash', false)}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <DollarSign className="w-5 h-5" />
              <span>Efectivo</span>
            </button>
            <button
              disabled={processing}
              onClick={() => openCheckout('credit_card', false)}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              <span>Tarjeta</span>
            </button>
            <button
              disabled={processing}
              onClick={() => openCheckout('nequi', false)}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Smartphone className="w-5 h-5" />
              <span>Nequi</span>
            </button>
            <button
              disabled={processing}
              onClick={() => openCheckout('cash', true)}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              <FileText className="w-5 h-5" />
              <span>{processing ? 'Procesando...' : 'Facturar'}</span>
            </button>
          </div>
        </div>
      </div>

      {checkout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Cobrar {formatCurrency(cartGrandTotal)}
                </h2>
                <p className="text-sm text-gray-500">
                  {PAYMENT_LABELS[checkout.method]}
                  {checkout.generateInvoice ? ' · Con factura' : ''}
                </p>
              </div>
              <button
                onClick={() => setCheckout(null)}
                disabled={processing}
                className="p-2 text-gray-400 hover:text-gray-600 rounded disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {isCashCheckout ? (
                <>
                  <div>
                    <label
                      htmlFor="received-cash"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Efectivo recibido
                    </label>
                    <input
                      id="received-cash"
                      type="number"
                      min="0"
                      step="50"
                      autoFocus
                      value={received === 0 ? '' : received}
                      onChange={(e) => setReceived(Math.max(Number(e.target.value), 0))}
                      className="w-full px-3 py-3 text-xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setReceived(cartGrandTotal)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Exacto
                    </button>
                    {BILL_DENOMINATIONS.map((bill) => (
                      <button
                        key={bill}
                        onClick={() => setReceived((prev) => prev + bill)}
                        className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        +{formatCurrency(bill)}
                      </button>
                    ))}
                    <button
                      onClick={() => setReceived(0)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-red-600 hover:bg-gray-200"
                    >
                      Limpiar
                    </button>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      received >= cartGrandTotal ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">
                        {received >= cartGrandTotal ? 'Devuelta' : 'Falta'}
                      </span>
                      <span
                        className={`text-2xl font-bold ${
                          received >= cartGrandTotal ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {formatCurrency(received >= cartGrandTotal ? changeDue : missingAmount)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total a cobrar</span>
                    <span className="font-bold">{formatCurrency(cartGrandTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método</span>
                    <span className="font-bold">{PAYMENT_LABELS[checkout.method]}</span>
                  </div>
                </div>
              )}

              {message?.type === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {message.text}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setCheckout(null)}
                  disabled={processing}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={processing || (isCashCheckout && received < cartGrandTotal)}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing
                    ? 'Procesando...'
                    : `Cobrar ${formatCurrency(cartGrandTotal)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
