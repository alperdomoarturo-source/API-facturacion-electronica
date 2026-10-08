import { supabase } from '@/supabase/client'
import { CashRegister, CashMovement } from '@/types'

export const cashService = {
  async getOpenCashRegister(userId: string) {
    const { data, error } = await supabase
      .from('cash_registers')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async openCashRegister(userId: string, openingAmount: number) {
    // Check if user already has an open register
    const existing = await this.getOpenCashRegister(userId)
    if (existing) {
      throw new Error('Ya tiene una caja abierta')
    }

    const { data, error } = await supabase
      .from('cash_registers')
      .insert({
        user_id: userId,
        opening_amount: openingAmount,
        opening_date: new Date().toISOString(),
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async closeCashRegister(registerId: string, countedAmount: number, userId: string) {
    const { data: register } = await supabase
      .from('cash_registers')
      .select('*')
      .eq('id', registerId)
      .single()

    if (!register) throw new Error('Caja no encontrada')

    const difference = countedAmount - register.opening_amount

    const { data, error } = await supabase
      .from('cash_registers')
      .update({
        closing_date: new Date().toISOString(),
        closing_amount: countedAmount,
        expected_amount: register.opening_amount,
        difference,
        status: 'closed',
      })
      .eq('id', registerId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getCashRegisterSummary(registerId: string) {
    const { data: register, error: registerError } = await supabase
      .from('cash_registers')
      .select('*')
      .eq('id', registerId)
      .single()

    if (registerError) throw registerError

    // Get sales for this register
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('total, payment_method')
      .eq('cash_register_id', registerId)

    if (salesError) throw salesError

    // Get movements
    const { data: movements, error: movementsError } = await supabase
      .from('cash_movements')
      .select('*')
      .eq('cash_register_id', registerId)

    if (movementsError) throw movementsError

    // Calculate totals by payment method
    const paymentTotals = {
      cash: 0,
      debit_card: 0,
      credit_card: 0,
      transfer: 0,
      nequi: 0,
      other: 0,
    }

    sales?.forEach(sale => {
      paymentTotals[sale.payment_method as keyof typeof paymentTotals] += sale.total
    })

    const entries = movements?.filter(m => m.type === 'entry').reduce((sum, m) => sum + m.amount, 0) || 0
    const exits = movements?.filter(m => m.type === 'exit').reduce((sum, m) => sum + m.amount, 0) || 0

    return {
      register,
      sales,
      movements,
      paymentTotals,
      entries,
      exits,
      totalExpected: register.opening_amount + paymentTotals.cash + entries - exits,
    }
  },

  async getCashRegisters(userId?: string) {
    let query = supabase
      .from('cash_registers')
      .select('*')
      .order('opening_date', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  async addCashMovement(
    registerId: string,
    type: 'entry' | 'exit',
    amount: number,
    reason: string,
    userId: string
  ) {
    const { data, error } = await supabase
      .from('cash_movements')
      .insert({
        cash_register_id: registerId,
        type,
        amount,
        reason,
        user_id: userId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getCashMovements(registerId: string) {
    const { data, error } = await supabase
      .from('cash_movements')
      .select('*')
      .eq('cash_register_id', registerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },
}
