import { supabase } from '@/supabase/client'
import { Ingredient, Inventory, InventoryMovement } from '@/types'

export const inventoryService = {
  async getIngredients() {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  },

  async getIngredient(id: string) {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async createIngredient(ingredient: Omit<Ingredient, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('ingredients')
      .insert(ingredient)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateIngredient(id: string, updates: Partial<Ingredient>) {
    const { data, error } = await supabase
      .from('ingredients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteIngredient(id: string) {
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getInventory() {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        ingredients (*)
      `)

    if (error) throw error
    return data
  },

  async updateStock(ingredientId: string, quantity: number, type: InventoryMovement['type'], reason?: string, userId?: string) {
    // Update inventory
    const { data: currentInventory } = await supabase
      .from('inventory')
      .select('current_stock')
      .eq('ingredient_id', ingredientId)
      .single()

    if (!currentInventory) throw new Error('Inventory not found')

    const newStock = currentInventory.current_stock + quantity

    const { error: updateError } = await supabase
      .from('inventory')
      .update({ current_stock: newStock, last_updated: new Date().toISOString() })
      .eq('ingredient_id', ingredientId)

    if (updateError) throw updateError

    // Record movement
    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        ingredient_id: ingredientId,
        quantity,
        type,
        reason,
        user_id: userId,
      })

    if (movementError) throw movementError

    return newStock
  },

  async getMovements(ingredientId?: string) {
    let query = supabase
      .from('inventory_movements')
      .select(`
        *,
        ingredients (*)
      `)
      .order('created_at', { ascending: false })

    if (ingredientId) {
      query = query.eq('ingredient_id', ingredientId)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  async getLowStock() {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        ingredients (*)
      `)
      .lt('current_stock', 'min_stock')

    if (error) throw error
    return data
  },
}
