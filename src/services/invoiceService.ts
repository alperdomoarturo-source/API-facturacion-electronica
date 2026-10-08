import { supabase } from '@/supabase/client'
import { Invoice, InvoiceItem, CreditNote, DebitNote } from '@/types'

export const invoiceService = {
  async getInvoices(startDate?: string, endDate?: string, status?: string) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        customers (*),
        sales (*)
      `)
      .order('created_at', { ascending: false })

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  async getInvoice(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (*),
        sales (
          *,
          sale_items (
            *,
            products (*)
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async createInvoice(saleId: string, customerId: string, userId: string) {
    const { data: existing } = await supabase
      .from('invoices')
      .select('*')
      .eq('sale_id', saleId)
      .maybeSingle()

    if (existing) return existing

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          products (*)
        )
      `)
      .eq('id', saleId)
      .single()

    if (saleError) throw saleError

    const { data: config } = await supabase
      .from('electronic_invoicing_config')
      .select('*')
      .maybeSingle()

    const prefix = config?.prefix || 'FAC'
    const nextFromRange = config ? Number(config.range_from || 0) + 1 : 0

    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })

    const sequential = nextFromRange || (count || 0) + 1
    const invoiceNumber = `${prefix}${String(sequential).padStart(4, '0')}`

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        sale_id: saleId,
        customer_id: customerId,
        invoice_number: invoiceNumber,
        prefix,
        status: 'pending',
      })
      .select()
      .single()

    if (invoiceError) throw invoiceError

    // Create invoice items
    const invoiceItems = (sale.sale_items || []).map((item: any) => ({
      invoice_id: invoice.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      tax: 0,
    }))

    if (invoiceItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems)

      if (itemsError) {
        // Rollback: delete invoice if items fail
        await supabase.from('invoices').delete().eq('id', invoice.id)
        throw new Error(`Error al crear items de factura: ${itemsError.message}`)
      }
    }

    // Update config range
    if (config?.id) {
      await supabase
        .from('electronic_invoicing_config')
        .update({ range_from: sequential })
        .eq('id', config.id)
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'create_invoice',
      entity: 'invoices',
      entity_id: invoice.id,
      details: `Invoice ${invoiceNumber} created`,
    }).then(() => undefined).catch(() => undefined)

    return invoice
  },

  async sendToDIAN(invoiceId: string) {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (!invoice) throw new Error('Factura no encontrada')

    // Update status to sending
    await supabase
      .from('invoices')
      .update({ status: 'sending' })
      .eq('id', invoiceId)

    // This would call the DIAN integration service
    // For now, we'll mark it as pending for manual configuration
    throw new Error('Integración DIAN no configurada')
  },

  async updateInvoiceStatus(id: string, status: Invoice['status'], dianResponse?: string) {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status,
        dian_response: dianResponse,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getCreditNotes(invoiceId?: string) {
    let query = supabase
      .from('credit_notes')
      .select(`
        *,
        invoices (*)
      `)
      .order('created_at', { ascending: false })

    if (invoiceId) {
      query = query.eq('invoice_id', invoiceId)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  async createCreditNote(invoiceId: string, reason: string, amount: number) {
    const { data, error } = await supabase
      .from('credit_notes')
      .insert({
        invoice_id: invoiceId,
        note_number: `NC-${Date.now()}`,
        reason,
        amount,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getDebitNotes(invoiceId?: string) {
    let query = supabase
      .from('debit_notes')
      .select(`
        *,
        invoices (*)
      `)
      .order('created_at', { ascending: false })

    if (invoiceId) {
      query = query.eq('invoice_id', invoiceId)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  async createDebitNote(invoiceId: string, reason: string, amount: number) {
    const { data, error } = await supabase
      .from('debit_notes')
      .insert({
        invoice_id: invoiceId,
        note_number: `ND-${Date.now()}`,
        reason,
        amount,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },
}
