import { supabase } from '@/supabase/client'
import { Recipe, RecipeItem } from '@/types'

export const recipeService = {
  async getRecipes() {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        products (*),
        recipe_items (
          *,
          ingredients (*)
        )
      `)

    if (error) throw error
    return data
  },

  async getRecipeByProduct(productId: string) {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_items (
          *,
          ingredients (*)
        )
      `)
      .eq('product_id', productId)
      .single()

    if (error) throw error
    return data
  },

  async createRecipe(recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>, items: Omit<RecipeItem, 'id' | 'created_at'>[]) {
    const { data, error } = await supabase
      .from('recipes')
      .insert(recipe)
      .select()
      .single()

    if (error) throw error

    // Calculate total cost
    let totalCost = 0
    for (const item of items) {
      const { data: ingredient } = await supabase
        .from('ingredients')
        .select('unit_cost')
        .eq('id', item.ingredient_id)
        .single()

      if (ingredient) {
        totalCost += ingredient.unit_cost * item.quantity
      }
    }

    // Update recipe with calculated cost
    await supabase
      .from('recipes')
      .update({ calculated_cost: totalCost })
      .eq('id', data.id)

    // Insert recipe items
    const recipeItems = items.map(item => ({
      ...item,
      recipe_id: data.id,
    }))

    const { error: itemsError } = await supabase
      .from('recipe_items')
      .insert(recipeItems)

    if (itemsError) throw itemsError

    return { ...data, calculated_cost: totalCost }
  },

  async updateRecipe(id: string, updates: Partial<Recipe>) {
    const { data, error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteRecipe(id: string) {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async addRecipeItem(recipeId: string, item: Omit<RecipeItem, 'id' | 'created_at' | 'recipe_id'>) {
    const { data, error } = await supabase
      .from('recipe_items')
      .insert({ ...item, recipe_id: recipeId })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateRecipeItem(id: string, updates: Partial<RecipeItem>) {
    const { data, error } = await supabase
      .from('recipe_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteRecipeItem(id: string) {
    const { error } = await supabase
      .from('recipe_items')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
