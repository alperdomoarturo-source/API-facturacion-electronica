import { supabase } from '@/supabase/client'
import { inventoryService } from '@/services/inventoryService'
import { Sale, SaleItem, CartItem } from '@/types'

export const salesService = {
  async getSales(startDate?: string, endDate?: string) {
    let query = supabase
      .from('sales')
      .select(`
        *,
        customers (*),
        sale_items (
          *,
          products (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  async getSale(id: string) {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers (*),
        sale_items (
          *,
          products (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async createSale(
    cartItems: CartItem[],
    paymentMethod: Sale['payment_method'],
    userId: string,
    customerId?: string,
    cashRegisterId?: string,
    discount: number = 0
  ) {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    const taxable = Math.max(subtotal - discount, 0)
    const tax = 0
    const total = taxable

    // Create sale
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        customer_id: customerId,
        subtotal,
        discount,
        tax,
        total,
        payment_method: paymentMethod,
        status: 'completed',
        cash_register_id: cashRegisterId,
        user_id: userId,
      })
      .select()
      .single()

    if (saleError) throw saleError

    // Create sale items
    const saleItems = cartItems.map(item => ({
      sale_id: sale.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      total: item.product.price * item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems)

    if (itemsError) throw itemsError

    // Deduct ingredients from inventory
    for (const cartItem of cartItems) {
      const { data: recipe } = await supabase
        .from('recipes')
        .select(`
          recipe_items (
            *,
            ingredients (*)
          )
        `)
        .eq('product_id', cartItem.product.id)
        .maybeSingle()

      if (recipe) {
        for (const recipeItem of recipe.recipe_items) {
          const quantityToDeduct = recipeItem.quantity * cartItem.quantity
          // No bloqueante: si falla el descuento de stock, la venta ya quedó registrada.
          await inventoryService
            .updateStock(recipeItem.ingredient_id, -quantityToDeduct, 'sale', undefined, userId)
            .catch((err) => console.error('Stock deduction failed:', err))
        }
      }
    }

    return sale
  },

  async cancelSale(id: string, userId: string) {
    const { error } = await supabase
      .from('sales')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) throw error

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'cancel_sale',
      entity: 'sales',
      entity_id: id,
      details: `Sale cancelled`,
    })
  },

  async refundSale(id: string, reason: string, userId: string) {
    const { error } = await supabase
      .from('sales')
      .update({ status: 'refunded' })
      .eq('id', id)

    if (error) throw error

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'refund_sale',
      entity: 'sales',
      entity_id: id,
      details: `Sale refunded: ${reason}`,
    })
  },
}
