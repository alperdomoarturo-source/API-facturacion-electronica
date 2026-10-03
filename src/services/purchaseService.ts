import { supabase } from '@/supabase/client'
import { Purchase, PurchaseItem } from '@/types'

export const purchaseService = {
  async getPurchases() {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        suppliers (*),
        purchase_items (
          *,
          ingredients (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getPurchase(id: string) {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        suppliers (*),
        purchase_items (
          *,
          ingredients (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async createPurchase(
    supplierId: string,
    items: Omit<PurchaseItem, 'id' | 'purchase_id'>[],
    userId: string,
    notes?: string
  ) {
    const total = items.reduce((sum, item) => sum + item.total, 0)
    const tax = total * 0.19 // Default 19% IVA

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        supplier_id: supplierId,
        total,
        tax,
        status: 'received',
        notes,
      })
      .select()
      .single()

    if (purchaseError) throw purchaseError

    // Create purchase items
    const purchaseItems = items.map(item => ({
      ...item,
      purchase_id: purchase.id,
    }))

    const { error: itemsError } = await supabase
      .from('purchase_items')
      .insert(purchaseItems)

    if (itemsError) throw itemsError

    // Update inventory
    for (const item of items) {
      await supabase.rpc('update_stock', {
        ingredient_id: item.ingredient_id,
        quantity: item.quantity,
        movement_type: 'purchase',
        user_id: userId,
      })
    }

    return purchase
  },

  async updatePurchase(id: string, updates: Partial<Purchase>) {
    const { data, error } = await supabase
      .from('purchases')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deletePurchase(id: string) {
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
