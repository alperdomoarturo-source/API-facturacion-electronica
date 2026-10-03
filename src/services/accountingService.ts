import { supabase } from '@/supabase/client'
import { AccountReceivable, AccountPayable } from '@/types'

export const accountingService = {
  async getAccountsReceivable(status?: string) {
    let query = supabase
      .from('accounts_receivable')
      .select(`
        *,
        customers (*),
        sales (*)
      `)
      .order('due_date', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  async createAccountReceivable(
    customerId: string,
    saleId: string,
    amount: number,
    dueDate: string
  ) {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .insert({
        customer_id: customerId,
        sale_id: saleId,
        amount,
        paid_amount: 0,
        balance: amount,
        due_date: dueDate,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async addPaymentToReceivable(id: string, amount: number) {
    const { data: current } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('id', id)
      .single()

    if (!current) throw new Error('Cuenta por cobrar no encontrada')

    const newPaidAmount = current.paid_amount + amount
    const newBalance = current.balance - amount
    const newStatus = newBalance <= 0 ? 'paid' : newPaidAmount > 0 ? 'partial' : 'pending'

    const { data, error } = await supabase
      .from('accounts_receivable')
      .update({
        paid_amount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getAccountsPayable(status?: string) {
    let query = supabase
      .from('accounts_payable')
      .select(`
        *,
        suppliers (*),
        purchases (*)
      `)
      .order('due_date', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  async createAccountPayable(
    supplierId: string,
    amount: number,
    dueDate: string,
    purchaseId?: string
  ) {
    const { data, error } = await supabase
      .from('accounts_payable')
      .insert({
        supplier_id: supplierId,
        purchase_id: purchaseId,
        amount,
        paid_amount: 0,
        balance: amount,
        due_date: dueDate,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async addPaymentToPayable(id: string, amount: number) {
    const { data: current } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('id', id)
      .single()

    if (!current) throw new Error('Cuenta por pagar no encontrada')

    const newPaidAmount = current.paid_amount + amount
    const newBalance = current.balance - amount
    const newStatus = newBalance <= 0 ? 'paid' : newPaidAmount > 0 ? 'partial' : 'pending'

    const { data, error } = await supabase
      .from('accounts_payable')
      .update({
        paid_amount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateOverdueAccounts() {
    const today = new Date().toISOString().split('T')[0]

    // Update receivable
    await supabase
      .from('accounts_receivable')
      .update({ status: 'overdue' })
      .lt('due_date', today)
      .in('status', ['pending', 'partial'])

    // Update payable
    await supabase
      .from('accounts_payable')
      .update({ status: 'overdue' })
      .lt('due_date', today)
      .in('status', ['pending', 'partial'])
  },
}
