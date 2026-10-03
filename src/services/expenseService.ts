import { supabase } from '@/supabase/client'
import { Expense } from '@/types'

export const expenseService = {
  async getExpenses(startDate?: string, endDate?: string, category?: string) {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        profiles (full_name),
        suppliers (*)
      `)
      .order('date', { ascending: false })

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  async getExpense(id: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        profiles (full_name),
        suppliers (*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateExpense(id: string, updates: Partial<Expense>) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteExpense(id: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getExpensesByCategory(startDate?: string, endDate?: string) {
    let query = supabase
      .from('expenses')
      .select('category, amount')

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data, error } = await query

    if (error) throw error

    // Group by category
    const grouped = data?.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    return grouped
  },
}
