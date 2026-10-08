'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { productService } from '@/services/productService'
import { inventoryService } from '@/services/inventoryService'
import { recipeService } from '@/services/recipeService'
import { Product, Category, Ingredient } from '@/types'
import { Plus, Edit, Trash2, Search, Image as ImageIcon, X } from 'lucide-react'

export default function MenuPage() {
  const { isAdmin } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsData, categoriesData, ingredientsData] = await Promise.all([
        productService.getProducts(),
        productService.getCategories(),
        inventoryService.getIngredients(),
      ])
      setProducts(productsData)
      setCategories(categoriesData)
      setIngredients(ingredientsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

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
          Acceso denegado. Solo los administradores pueden gestionar el menú.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menú</h1>
          <p className="text-gray-600 mt-2">Gestiona tus productos y categorías</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setEditingCategory(null)
              setShowCategoryModal(true)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Categoría</span>
          </button>
          <button
            onClick={() => {
              setEditingProduct(null)
              setShowProductModal(true)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center space-x-4">
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
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const category = categories.find((c) => c.id === product.category_id)
          return (
            <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="text-xs text-blue-600 font-medium">
                      {category?.name}
                    </span>
                    <h3 className="font-semibold text-gray-900 mt-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product)
                        setShowProductModal(true)
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Estás seguro de eliminar este producto?')) {
                          productService.deleteProduct(product.id).then(fetchData)
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</p>
                    <p className="text-xs text-gray-500">Costo: {formatCurrency(product.cost)}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      product.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          ingredients={ingredients}
          onClose={() => {
            setShowProductModal(false)
            setEditingProduct(null)
          }}
          onSave={() => {
            fetchData()
            setShowProductModal(false)
            setEditingProduct(null)
          }}
        />
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false)
            setEditingCategory(null)
          }}
          onSave={() => {
            fetchData()
            setShowCategoryModal(false)
            setEditingCategory(null)
          }}
        />
      )}
    </div>
  )
}

function ProductModal({
  product,
  categories,
  ingredients,
  onClose,
  onSave,
}: {
  product: Product | null
  categories: Category[]
  ingredients: Ingredient[]
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category_id: product?.category_id || '',
    price: product?.price || 0,
    cost: product?.cost || 0,
    active: product?.active ?? true,
    image_url: product?.image_url || '',
  })
  const [recipeItems, setRecipeItems] = useState<{ ingredient_id: string; quantity: number }[]>([])
  const [loadingRecipe, setLoadingRecipe] = useState(false)

  useEffect(() => {
    if (!product) return
    let cancelled = false
    setLoadingRecipe(true)
    recipeService
      .getRecipeByProduct(product.id)
      .then((recipe: any) => {
        if (cancelled) return
        const items = (recipe?.recipe_items || []).map((ri: any) => ({
          ingredient_id: ri.ingredient_id,
          quantity: Number(ri.quantity),
        }))
        setRecipeItems(items)
      })
      .catch(() => {
        // Sin receta todavía: dejar vacío.
      })
      .finally(() => {
        if (!cancelled) setLoadingRecipe(false)
      })
    return () => {
      cancelled = true
    }
  }, [product])

  const addRecipeItem = () => {
    const used = new Set(recipeItems.map((i) => i.ingredient_id))
    const firstAvailable = ingredients.find((ing) => !used.has(ing.id))
    setRecipeItems([...recipeItems, { ingredient_id: firstAvailable?.id || '', quantity: 1 }])
  }

  const updateRecipeItem = (index: number, patch: Partial<{ ingredient_id: string; quantity: number }>) => {
    setRecipeItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const removeRecipeItem = (index: number) => {
    setRecipeItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let productId = product?.id
      if (product) {
        await productService.updateProduct(product.id, formData)
      } else {
        const created = await productService.createProduct(formData as any)
        productId = created.id
      }

      if (productId) {
        const cleanItems = recipeItems.filter((i) => i.ingredient_id && Number(i.quantity) > 0)
        await recipeService.setRecipeForProduct(productId, cleanItems)
      }

      onSave()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error al guardar el producto')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio
              </label>
              <input
                type="number"
                required
                min="0"
                step="100"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo
              </label>
              <input
                type="number"
                required
                min="0"
                step="100"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de imagen
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="active" className="ml-2 text-sm text-gray-700">
              Producto activo
            </label>
          </div>

          {/* Ingredientes (receta) */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ingredientes
                </label>
                <p className="text-xs text-gray-500">
                  Se descuentan del inventario automáticamente al vender este producto.
                </p>
              </div>
              <button
                type="button"
                onClick={addRecipeItem}
                disabled={ingredients.length === 0}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            {ingredients.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay ingredientes. Créalos primero en la sección Inventario.
              </p>
            ) : loadingRecipe ? (
              <p className="text-sm text-gray-500">Cargando ingredientes...</p>
            ) : recipeItems.length === 0 ? (
              <p className="text-sm text-gray-500">
                Sin ingredientes. Este producto no descontará stock.
              </p>
            ) : (
              <div className="space-y-2">
                {recipeItems.map((item, index) => {
                  const selected = ingredients.find((ing) => ing.id === item.ingredient_id)
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <select
                        value={item.ingredient_id}
                        onChange={(e) => updateRecipeItem(index, { ingredient_id: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar ingrediente</option>
                        {ingredients.map((ing) => (
                          <option
                            key={ing.id}
                            value={ing.id}
                            disabled={
                              ing.id !== item.ingredient_id &&
                              recipeItems.some((r) => r.ingredient_id === ing.id)
                            }
                          >
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateRecipeItem(index, { quantity: Number(e.target.value) })}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-500 w-12">{selected?.unit}</span>
                      <button
                        type="button"
                        onClick={() => removeRecipeItem(index)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CategoryModal({
  category,
  onClose,
  onSave,
}: {
  category: Category | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    sort_order: category?.sort_order || 0,
    active: category?.active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (category) {
        await productService.updateCategory(category.id, formData)
      } else {
        await productService.createCategory(formData as any)
      }
      onSave()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Error al guardar la categoría')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {category ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Orden
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="active" className="ml-2 text-sm text-gray-700">
              Categoría activa
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
