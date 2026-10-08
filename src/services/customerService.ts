import { supabase } from '@/supabase/client'
import { Customer } from '@/types'

export const customerService = {
  async getCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  },

  async getCustomer(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async findOrCreateWalkInCustomer() {
    const documentNumber = '222222222222'
    const { data: existing, error: lookupError } = await supabase
      .from('customers')
      .select('*')
      .eq('document_number', documentNumber)
      .maybeSingle()

    if (lookupError) throw lookupError
    if (existing) return existing

    const { data, error } = await supabase
      .from('customers')
      .insert({
        document_type: 'CC',
        document_number: documentNumber,
        name: 'Consumidor Final',
        tax_regime: '49',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async searchCustomers(query: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,document_number.ilike.%${query}%`)
      .order('name')

    if (error) throw error
    return data
  },

  async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateCustomer(id: string, updates: Partial<Customer>) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteCustomer(id: string) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getCustomerHistory(customerId: string) {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          products (*)
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },
}
