'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { recipeService } from '@/services/recipeService'
import { productService } from '@/services/productService'
import { inventoryService } from '@/services/inventoryService'
import { Recipe, RecipeItem, Product, Ingredient } from '@/types'
import { Plus, Edit, Trash2, BookOpen, DollarSign } from 'lucide-react'

export default function RecipesPage() {
  const { isAdmin } = useAuth()
  const [recipes, setRecipes] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingRecipe, setEditingRecipe] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [recipesData, productsData, ingredientsData] = await Promise.all([
        recipeService.getRecipes(),
        productService.getProducts(),
        inventoryService.getIngredients(),
      ])
      setRecipes(recipesData)
      setProducts(productsData)
      setIngredients(ingredientsData)
    } catch (error) {
      console.error('Error fetching data:', error)
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

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Acceso denegado. Solo los administradores pueden gestionar las recetas.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <h1 className="text-3xl font-bold text-gray-900">Recetas</h1>
          <p className="text-gray-600 mt-2">Gestiona las recetas de tus productos</p>
        </div>
        <button
          onClick={() => {
            setSelectedProduct(null)
            setEditingRecipe(null)
            setShowModal(true)
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Receta</span>
        </button>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => {
          const product = products.find((p) => p.id === recipe.product_id)
          return (
            <div key={recipe.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{product?.name}</h3>
                    <p className="text-sm text-gray-500">Costo calculado</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      setEditingRecipe(recipe)
                      setSelectedProduct(product || null)
                      setShowModal(true)
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Estás seguro de eliminar esta receta?')) {
                        recipeService.deleteRecipe(recipe.id).then(fetchData)
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Costo total:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(recipe.calculated_cost)}
                  </span>
                </div>
                {product && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">Precio venta:</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                )}
                {product && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">Margen:</span>
                    <span className={`text-sm font-semibold ${
                      (product.price - recipe.calculated_cost) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(product.price - recipe.calculated_cost)}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ingredientes:</h4>
                <div className="space-y-2">
                  {recipe.recipe_items?.map((item: RecipeItem) => {
                    const ingredient = ingredients.find((i) => i.id === item.ingredient_id)
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{ingredient?.name}</span>
                        <span className="text-gray-900">
                          {item.quantity} {ingredient?.unit}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recipe Modal */}
      {showModal && (
        <RecipeModal
          product={selectedProduct}
          products={products}
          ingredients={ingredients}
          recipe={editingRecipe}
          onClose={() => {
            setShowModal(false)
            setSelectedProduct(null)
            setEditingRecipe(null)
          }}
          onSave={() => {
            fetchData()
            setShowModal(false)
            setSelectedProduct(null)
            setEditingRecipe(null)
          }}
        />
      )}
    </div>
  )
}

function RecipeModal({
  product,
  products,
  ingredients,
  recipe,
  onClose,
  onSave,
}: {
  product: Product | null
  products: Product[]
  ingredients: Ingredient[]
  recipe: any
  onClose: () => void
  onSave: () => void
}) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(product)
  const [recipeItems, setRecipeItems] = useState<any[]>(
    recipe?.recipe_items || []
  )
  const [newItem, setNewItem] = useState({
    ingredient_id: '',
    quantity: 0,
  })

  const existingRecipeProductIds = recipe ? [recipe.product_id] : []
  const availableProducts = products.filter(
    (p) => !existingRecipeProductIds.includes(p.id) || p.id === selectedProduct?.id
  )

  const addRecipeItem = () => {
    if (newItem.ingredient_id && newItem.quantity > 0) {
      setRecipeItems([...recipeItems, { ...newItem }])
      setNewItem({ ingredient_id: '', quantity: 0 })
    }
  }

  const removeRecipeItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index))
  }

  const calculateTotalCost = () => {
    return recipeItems.reduce((sum, item) => {
      const ingredient = ingredients.find((i) => i.id === item.ingredient_id)
      return sum + (ingredient?.unit_cost || 0) * item.quantity
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) {
      alert('Selecciona un producto')
      return
    }
    if (recipeItems.length === 0) {
      alert('Agrega al menos un ingrediente')
      return
    }

    try {
      if (recipe) {
        await recipeService.updateRecipe(recipe.id, {})
        // Delete existing items and add new ones
        for (const item of recipe.recipe_items) {
          await recipeService.deleteRecipeItem(item.id)
        }
        for (const item of recipeItems) {
          await recipeService.addRecipeItem(recipe.id, item)
        }
      } else {
        await recipeService.createRecipe(
          { product_id: selectedProduct.id, calculated_cost: calculateTotalCost() },
          recipeItems
        )
      }
      onSave()
    } catch (error) {
      console.error('Error saving recipe:', error)
      alert('Error al guardar la receta')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {recipe ? 'Editar Receta' : 'Nueva Receta'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto
            </label>
            <select
              required
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const product = products.find((p) => p.id === e.target.value)
                setSelectedProduct(product || null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar producto</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingredientes</h3>
            
            {/* Add new ingredient */}
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
              <button
                type="button"
                onClick={addRecipeItem}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Recipe items list */}
            <div className="space-y-2">
              {recipeItems.map((item, index) => {
                const ingredient = ingredients.find((i) => i.id === item.ingredient_id)
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{ingredient?.name}</span>
                      <span className="text-gray-600 ml-2">
                        {item.quantity} {ingredient?.unit}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRecipeItem(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cost summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-gray-900">Costo total de receta:</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(calculateTotalCost())}
              </span>
            </div>
            {selectedProduct && (
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-gray-600">Margen estimado:</span>
                <span className={`font-semibold ${
                  (selectedProduct.price - calculateTotalCost()) > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(selectedProduct.price - calculateTotalCost())}
                </span>
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}
