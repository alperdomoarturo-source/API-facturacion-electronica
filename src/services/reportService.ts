import { supabase } from '@/supabase/client'

export const reportService = {
  async getSalesStats(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('sales')
      .select('total, payment_method, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('status', 'completed')

    if (error) throw error

    const totalSales = data?.reduce((sum, sale) => sum + sale.total, 0) || 0
    const salesByMethod = data?.reduce((acc, sale) => {
      acc[sale.payment_method] = (acc[sale.payment_method] || 0) + sale.total
      return acc
    }, {} as Record<string, number>) || {}

    return {
      totalSales,
      salesCount: data?.length || 0,
      salesByMethod,
    }
  },

  async getTopProducts(startDate: string, endDate: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('sale_items')
      .select(`
        quantity,
        total,
        products (name)
      `)

    if (error) throw error

    const productSales = data?.reduce((acc: any, item: any) => {
      const productName = item.products?.name || 'Unknown'
      acc[productName] = (acc[productName] || 0) + item.quantity
      return acc
    }, {} as Record<string, number>) || {}

    return Object.entries(productSales)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, limit)
  },

  async getInventoryStats() {
    const { data, error } = await supabase
      .from('ingredients')
      .select('name, current_stock, min_stock, unit_cost')

    if (error) throw error

    const totalValue = data?.reduce((sum: number, item: any) => {
      return sum + (Number(item.current_stock || 0) * Number(item.unit_cost || 0))
    }, 0) || 0

    const lowStock = data?.filter(item => Number(item.current_stock) < Number(item.min_stock)).length || 0
    const outOfStock = data?.filter(item => Number(item.current_stock) === 0).length || 0

    return {
      totalValue,
      lowStock,
      outOfStock,
      totalItems: data?.length || 0,
    }
  },

  async getFinancialStats(startDate: string, endDate: string) {
    // Get sales
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('total, subtotal')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('status', 'completed')

    if (salesError) throw salesError

    const totalRevenue = sales?.reduce((sum, sale) => sum + sale.total, 0) || 0
    const totalCost = sales?.reduce((sum, sale) => sum + sale.subtotal, 0) || 0

    // Get expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('date', startDate)
      .lte('date', endDate)

    if (expensesError) throw expensesError

    const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0

    // Get purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('total')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (purchasesError) throw purchasesError

    const totalPurchases = purchases?.reduce((sum, purchase) => sum + purchase.total, 0) || 0

    // Get accounts receivable
    const { data: receivable, error: receivableError } = await supabase
      .from('accounts_receivable')
      .select('balance')
      .eq('status', 'pending')

    if (receivableError) throw receivableError

    const totalReceivable = receivable?.reduce((sum, acc) => sum + acc.balance, 0) || 0

    // Get accounts payable
    const { data: payable, error: payableError } = await supabase
      .from('accounts_payable')
      .select('balance')
      .eq('status', 'pending')

    if (payableError) throw payableError

    const totalPayable = payable?.reduce((sum, acc) => sum + acc.balance, 0) || 0

    const estimatedProfit = totalRevenue - totalCost - totalExpenses

    return {
      totalRevenue,
      totalCost,
      totalExpenses,
      totalPurchases,
      totalReceivable,
      totalPayable,
      estimatedProfit,
    }
  },

  async getInvoiceStats(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('status')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (error) throw error

    const generated = data?.length || 0
    const accepted = data?.filter(i => i.status === 'accepted').length || 0
    const rejected = data?.filter(i => i.status === 'rejected').length || 0
    const pending = data?.filter(i => i.status === 'pending').length || 0

    return {
      generated,
      accepted,
      rejected,
      pending,
    }
  },
}
