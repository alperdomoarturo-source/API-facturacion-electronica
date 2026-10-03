import { supabase } from '@/supabase/client'
import { ElectronicInvoicingConfig, DIANDocument } from '@/types'

export const dianService = {
  async getConfig() {
    const { data, error } = await supabase
      .from('electronic_invoicing_config')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async updateConfig(config: Partial<ElectronicInvoicingConfig>) {
    const { data, error } = await supabase
      .from('electronic_invoicing_config')
      .update(config)
      .eq('id', config.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async createConfig(config: Omit<ElectronicInvoicingConfig, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('electronic_invoicing_config')
      .insert(config)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async testConnection() {
    const config = await this.getConfig()

    if (!config) {
      return { success: false, message: 'Configuración no encontrada' }
    }

    if (config.status !== 'configured') {
      return { success: false, message: 'Configuración incompleta' }
    }

    // This would test the actual connection to the DIAN provider
    // For now, return a placeholder response
    return { success: true, message: 'Conexión exitosa (prueba)' }
  },

  async generateXML(invoiceId: string): Promise<string> {
    // Get invoice details
    const { data: invoice } = await supabase
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
      .eq('id', invoiceId)
      .single()

    if (!invoice) throw new Error('Factura no encontrada')

    // Generate XML (simplified example)
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
  <InvoiceNumber>${invoice.invoice_number}</InvoiceNumber>
  <Customer>
    <DocumentType>${invoice.customers.document_type}</DocumentType>
    <DocumentNumber>${invoice.customers.document_number}</DocumentNumber>
    <Name>${invoice.customers.name}</Name>
  </Customer>
  <Items>
    ${invoice.sales.sale_items.map((item: any) => `
    <Item>
      <Name>${item.products.name}</Name>
      <Quantity>${item.quantity}</Quantity>
      <UnitPrice>${item.unit_price}</UnitPrice>
      <Total>${item.total}</Total>
    </Item>`).join('')}
  </Items>
  <Total>${invoice.sales.total}</Total>
</Invoice>`

    return xml
  },

  async generateCUFE(invoiceId: string): Promise<string> {
    // CUFE generation requires cryptographic hashing of invoice data
    // This is a simplified placeholder
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    return `CUFE-${timestamp}-${random}`.toUpperCase()
  },

  async sendToDIAN(invoiceId: string) {
    const config = await this.getConfig()

    if (!config || config.status !== 'configured') {
      throw new Error('Facturación electrónica no configurada')
    }

    // Generate XML
    const xml = await this.generateXML(invoiceId)

    // Generate CUFE
    const cufe = await this.generateCUFE(invoiceId)

    // Update invoice with XML and CUFE
    await supabase
      .from('invoices')
      .update({
        xml,
        cufe,
        status: 'sending',
      })
      .eq('id', invoiceId)

    // This would send to the actual DIAN provider
    // For now, we'll return a mock response
    const mockResponse = {
      success: true,
      message: 'Factura enviada a DIAN (simulación)',
      cufe,
    }

    // Create DIAN document record
    await supabase.from('dian_documents').insert({
      type: 'invoice',
      document_id: invoiceId,
      cufe,
      xml,
      status: 'pending',
      sent_at: new Date().toISOString(),
    })

    return mockResponse
  },

  async processDIANResponse(documentId: string, response: any) {
    await supabase
      .from('dian_documents')
      .update({
        status: response.success ? 'accepted' : 'rejected',
        response_code: response.code,
        response_message: response.message,
        response_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    // Update corresponding invoice status
    const { data: document } = await supabase
      .from('dian_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (document) {
      await supabase
        .from('invoices')
        .update({
          status: response.success ? 'accepted' : 'rejected',
          dian_response: response.message,
        })
        .eq('id', document.document_id)
    }
  },

  async getDIANDocument(documentId: string) {
    const { data, error } = await supabase
      .from('dian_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (error) throw error
    return data
  },
}
