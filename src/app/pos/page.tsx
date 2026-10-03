'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { productService } from '@/services/productService'
import { customerService } from '@/services/customerService'
import { CartItem, Product, Customer } from '@/types'
import { ShoppingCart, Search, Plus, Minus, CreditCard, DollarSign, Smartphone, FileText } from 'lucide-react'

export default function POSPage() {
  const { isAdmin, isCashier } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data for now
  const mockProducts: Product[] = [
    {
      id: '1',
      category_id: '1',
      name: 'Hamburguesa API',
      description: 'Hamburguesa especial con carne, queso y vegetales',
      price: 25000,
      cost: 11000,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      category_id: '1',
      name: 'Hamburguesa Doble',
      description: 'Hamburguesa con doble carne',
      price: 32000,
      cost: 16000,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      category_id: '1',
      name: 'Combo API',
      description: 'Hamburguesa + papas + gaseosa',
      price: 35000,
      cost: 15000,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '4',
      category_id: '2',
      name: 'Papas',
      description: 'Papas fritas',
      price: 8000,
      cost: 3000,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '5',
      category_id: '3',
      name: 'Coca-Cola',
      description: 'Gaseosa 350ml',
      price: 5000,
      cost: 2000,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '6',
      category_id: '3',
      name: 'Agua',
      description: 'Agua 500ml',
      price: 3000,
      cost: 1000,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const mockCategories = [
    { id: '1', name: 'Hamburguesas' },
    { id: '2', name: 'Acompañamientos' },
    { id: '3', name: 'Bebidas' },
  ]

  useEffect(() => {
    setProducts(mockProducts)
    setCategories(mockCategories)
    setLoading(false)
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
  const cartTax = cartTotal * 0.19
  const cartGrandTotal = cartTotal + cartTax

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
        setCustomerResults(results)
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

  return (
    <div className="flex h-screen">
      {/* Left side - Products */}
      <div className="flex-1 flex flex-col">
        {/* Search and Categories */}
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

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
              >
                <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Sin imagen</span>
                </div>
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="text-blue-600 font-bold mt-1">{formatCurrency(product.price)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Cart */}
      <div className="w-96 bg-white border-l flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <ShoppingCart className="w-6 h-6 mr-2" />
            Carrito
          </h2>
        </div>

        {/* Customer Selection */}
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
            <div className="mt-2 text-sm text-gray-600">
              Cliente: {selectedCustomer.name}
            </div>
          )}
        </div>

        {/* Cart Items */}
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

        {/* Totals and Payment */}
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>IVA (19%)</span>
              <span>{formatCurrency(cartTax)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(cartGrandTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <DollarSign className="w-5 h-5" />
              <span>Efectivo</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <CreditCard className="w-5 h-5" />
              <span>Tarjeta</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Smartphone className="w-5 h-5" />
              <span>Nequi</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              <FileText className="w-5 h-5" />
              <span>Facturar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
