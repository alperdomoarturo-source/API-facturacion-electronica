'use client'

import { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import { useAuth } from '@/hooks/useAuth'
import { invoiceService } from '@/services/invoiceService'
import { dianService } from '@/services/dianService'
import { supabase } from '@/supabase/client'
import { Invoice, Restaurant } from '@/types'
import { FileText, CheckCircle, XCircle, Clock, Settings, Download, Send, Search } from 'lucide-react'

const paymentLabels: Record<string, string> = {
  cash: 'Efectivo',
  debit_card: 'Débito',
  credit_card: 'Tarjeta',
  transfer: 'Transferencia',
  nequi: 'Nequi',
  other: 'Otro',
}

// Leyenda para régimen no responsable (no obligado a facturar electrónicamente).
const NO_OBLIGADO_LEYEND =
  'No obligado a facturar electrónicamente. Régimen no responsable de IVA.'

interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  total: number
}

interface ReceiptData {
  restaurantName: string
  restaurantNit: string
  restaurantPhone: string
  restaurantAddress: string
  number: string
  date: string
  customerName: string
  customerDoc: string
  paymentMethod: string
  items: ReceiptItem[]
  total: number
}

function buildReceipt(full: any, restaurant: Restaurant | null, formatCurrency: (v: number) => string): ReceiptData {
  const sale = full?.sales || {}
  const customer = full?.customers || {}
  const rawItems: any[] = sale.sale_items || []
  const items: ReceiptItem[] = rawItems.map((item) => ({
    name: item.products?.name || 'Producto',
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unit_price || 0),
    total: Number(item.total || 0),
  }))
  // Régimen no responsable: el total es la suma de los ítems, sin IVA.
  const total = items.reduce((sum, it) => sum + it.total, 0)
  return {
    restaurantName: restaurant?.name || 'Restaurante',
    restaurantNit: restaurant?.nit || '',
    restaurantPhone: restaurant?.phone || '',
    restaurantAddress: [restaurant?.address, restaurant?.city].filter(Boolean).join(', '),
    number: full?.invoice_number || '',
    date: new Date(full?.created_at || Date.now()).toLocaleDateString('es-CO'),
    customerName: customer.name || 'Cliente',
    customerDoc: [customer.document_type, customer.document_number].filter(Boolean).join(' '),
    paymentMethod: sale.payment_method ? paymentLabels[sale.payment_method] || sale.payment_method : '',
    items,
    total,
  }
}

function buildReceiptHTML(r: ReceiptData, formatCurrency: (v: number) => string): string {
  const rows = r.items
    .map(
      (it) =>
        `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee;">${it.name}</td>` +
        `<td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center;">${it.quantity}</td>` +
        `<td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(it.unitPrice)}</td>` +
        `<td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(it.total)}</td></tr>`
    )
    .join('')
  return (
    `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:520px;margin:0 auto;">` +
    `<h2 style="margin:0 0 4px;">${r.restaurantName}</h2>` +
    `<div style="font-size:12px;color:#555;">${r.restaurantNit ? `NIT/CC: ${r.restaurantNit}` : ''}` +
    `${r.restaurantAddress ? ` · ${r.restaurantAddress}` : ''}${r.restaurantPhone ? ` · Tel: ${r.restaurantPhone}` : ''}</div>` +
    `<hr style="border:none;border-top:1px solid #ddd;margin:12px 0;" />` +
    `<div style="font-size:13px;"><strong>Cuenta de cobro N°:</strong> ${r.number}<br/>` +
    `<strong>Fecha:</strong> ${r.date}<br/>` +
    `<strong>Cliente:</strong> ${r.customerName}${r.customerDoc ? ` (${r.customerDoc})` : ''}` +
    `${r.paymentMethod ? `<br/><strong>Medio de pago:</strong> ${r.paymentMethod}` : ''}</div>` +
    `<table style="width:100%;border-collapse:collapse;margin-top:14px;font-size:13px;">` +
    `<thead><tr style="background:#f5f5f5;text-align:left;">` +
    `<th style="padding:6px 8px;">Producto</th><th style="padding:6px 8px;text-align:center;">Cant</th>` +
    `<th style="padding:6px 8px;text-align:right;">Valor</th><th style="padding:6px 8px;text-align:right;">Total</th>` +
    `</tr></thead><tbody>${rows}</tbody></table>` +
    `<div style="text-align:right;font-size:16px;font-weight:bold;margin-top:12px;">TOTAL: ${formatCurrency(r.total)}</div>` +
    `<p style="font-size:11px;color:#777;margin-top:20px;text-align:center;">${NO_OBLIGADO_LEYEND}</p>` +
    `</div>`
  )
}

export default function InvoicingPage() {
  const { isAdmin, isCashier } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [config, setConfig] = useState<any>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [emailTarget, setEmailTarget] = useState<Invoice | null>(null)
  const [emailTo, setEmailTo] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    fetchInvoices()
    fetchConfig()
    fetchRestaurant()
  }, [])

  const fetchRestaurant = async () => {
    const { data } = await supabase.from('restaurant').select('*').maybeSingle()
    setRestaurant(data as Restaurant | null)
  }

  const fetchInvoices = async () => {
    try {
      const data = await invoiceService.getInvoices()
      setInvoices(data)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConfig = async () => {
    try {
      const configData = await dianService.getConfig()
      setConfig(configData)
    } catch (error) {
      console.error('Error fetching config:', error)
    }
  }

  const handleTestConnection = async () => {
    try {
      const result = await dianService.testConnection()
      alert(result.message)
    } catch (error: any) {
      alert(error.message || 'Error al probar conexión')
    }
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesStatus = !filterStatus || invoice.status === filterStatus
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente', icon: Clock },
      sending: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Enviando', icon: Clock },
      accepted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aceptada', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazada', icon: XCircle },
      error: { bg: 'bg-red-100', text: 'text-red-800', label: 'Error', icon: XCircle },
    }
    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    )
  }

  const handleDownloadPDF = async (invoice: Invoice) => {
    setDownloadingId(invoice.id)
    try {
      const full = await invoiceService.getInvoice(invoice.id)
      if (!full) {
        alert('No se pudo obtener el detalle de la factura.')
        return
      }

      const sale: any = full.sales || {}
      const customer: any = full.customers || {}
      const items: any[] = sale.sale_items || []

      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 40
      const right = pageWidth - margin
      let y = 50

      // Encabezado: datos del restaurante
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text(restaurant?.name || 'Cuenta de Cobro', margin, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const companyLines = [
        restaurant?.nit ? `NIT: ${restaurant.nit}` : '',
        restaurant?.address || '',
        [restaurant?.city, restaurant?.phone ? `Tel: ${restaurant.phone}` : ''].filter(Boolean).join(' - '),
        restaurant?.email || '',
      ].filter(Boolean)
      companyLines.forEach((line) => {
        y += 13
        doc.text(line, margin, y)
      })

      // Caja superior derecha: tipo y número de documento
      const boxW = 210
      const boxX = right - boxW
      doc.setDrawColor(200)
      doc.rect(boxX, 40, boxW, 58)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('CUENTA DE COBRO', right - 12, 58, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`N°: ${full.invoice_number}`, right - 12, 76, { align: 'right' })
      doc.text(
        `Fecha: ${new Date(full.created_at).toLocaleDateString('es-CO')}`,
        right - 12,
        90,
        { align: 'right' }
      )

      y = Math.max(y, 110) + 24

      // Datos del cliente
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('CLIENTE', margin, y)
      y += 4
      doc.setDrawColor(220)
      doc.line(margin, y, right, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      y += 16
      const docType = customer.document_type ? `${customer.document_type}: ` : ''
      doc.text(`Nombre: ${customer.name || 'Cliente'}`, margin, y)
      doc.text(`${docType}${customer.document_number || ''}`, right, y, { align: 'right' })
      y += 15
      if (customer.email || customer.phone) {
        doc.text(customer.email || '', margin, y)
        doc.text(customer.phone || '', right, y, { align: 'right' })
        y += 15
      }
      if (customer.address) {
        doc.text(`Dirección: ${customer.address}`, margin, y)
        y += 15
      }
      if (sale.payment_method) {
        doc.text(`Medio de pago: ${paymentLabels[sale.payment_method] || sale.payment_method}`, margin, y)
        y += 15
      }

      y += 10

      // Tabla de ítems
      const colQty = margin
      const colDesc = margin + 45
      const colUnit = right - 150
      const colTotal = right
      const headerY = y
      doc.setFillColor(243, 244, 246)
      doc.rect(margin, headerY - 12, right - margin, 20, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('CANT', colQty, headerY + 2)
      doc.text('DESCRIPCIÓN', colDesc, headerY + 2)
      doc.text('V. UNITARIO', colUnit, headerY + 2, { align: 'right' })
      doc.text('TOTAL', colTotal, headerY + 2, { align: 'right' })
      y = headerY + 20

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      items.forEach((item) => {
        if (y > 720) {
          doc.addPage()
          y = 50
        }
        const name = item.products?.name || 'Producto'
        const desc = doc.splitTextToSize(name, colUnit - colDesc - 20)
        doc.text(String(item.quantity), colQty, y)
        doc.text(desc, colDesc, y)
        doc.text(formatCurrency(Number(item.unit_price || 0)), colUnit, y, { align: 'right' })
        doc.text(formatCurrency(Number(item.total || 0)), colTotal, y, { align: 'right' })
        y += Math.max(15, desc.length * 12)
      })

      // Total (régimen no responsable: sin IVA)
      const total = items.reduce((sum, it) => sum + Number(it.total || 0), 0)
      y += 8
      doc.setDrawColor(220)
      doc.line(colUnit - 10, y, right, y)
      y += 22
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('TOTAL', colUnit - 10, y)
      doc.text(formatCurrency(total), colTotal, y, { align: 'right' })

      // Pie: leyenda de no obligado a facturar
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const legendY = Math.max(y + 30, 760)
      const legend = doc.splitTextToSize(NO_OBLIGADO_LEYEND, right - margin)
      doc.text(legend, margin, legendY)

      doc.save(`Cuenta-de-cobro-${full.invoice_number}.pdf`)
    } catch (error: any) {
      console.error('Error generating invoice PDF:', error)
      alert(error?.message || 'No se pudo generar el PDF de la factura.')
    } finally {
      setDownloadingId(null)
    }
  }

  const openEmailModal = (invoice: Invoice) => {
    const presetEmail = (invoice as any).customers?.email || ''
    setEmailTo(presetEmail)
    setEmailTarget(invoice)
  }

  const confirmSendEmail = async () => {
    if (!emailTarget) return
    const recipient = emailTo.trim()
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      alert('Ingresa un correo válido del cliente.')
      return
    }

    setSendingEmail(true)
    try {
      const full = await invoiceService.getInvoice(emailTarget.id)
      if (!full) throw new Error('No se pudo obtener el detalle de la factura.')
      const receipt = buildReceipt(full, restaurant, formatCurrency)
      const messageHtml = buildReceiptHTML(receipt, formatCurrency)

      const res = await fetch('/api/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          subject: `Cuenta de cobro ${receipt.number} - ${receipt.restaurantName}`,
          html: messageHtml,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'No se pudo enviar el correo.')

      alert(`Recibo enviado a ${recipient}.`)
      setEmailTarget(null)
      setEmailTo('')
    } catch (error: any) {
      console.error('Error sending email:', error)
      alert(error?.message || 'No se pudo enviar el correo.')
    } finally {
      setSendingEmail(false)
    }
  }

  if (!isAdmin && !isCashier) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Acceso denegado.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturación Electrónica</h1>
          <p className="text-gray-600 mt-2">Gestiona tus facturas electrónicas</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Configuración DIAN</span>
          </button>
        )}
      </div>

      {/* Config Status */}
      {config && (
        <div className={`mb-6 p-4 rounded-lg ${
          config.status === 'configured' ? 'bg-green-50 border border-green-200' :
          config.status === 'incomplete' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {config.status === 'configured' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : config.status === 'incomplete' ? (
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className="font-medium">
                {config.status === 'configured' ? 'Facturación electrónica configurada' :
                 config.status === 'incomplete' ? 'Configuración incompleta' :
                 'Error en configuración'}
              </span>
            </div>
            {isAdmin && (
              <button
                onClick={handleTestConnection}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Probar conexión
              </button>
            )}
          </div>
        </div>
      )}

      {!config && isAdmin && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="font-medium">Facturación electrónica no configurada</span>
            <button
              onClick={() => setShowConfigModal(true)}
              className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              Configurar ahora
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar facturas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="sending">Enviando</option>
            <option value="accepted">Aceptada</option>
            <option value="rejected">Rechazada</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Número
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {invoice.invoice_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(invoice.created_at).toLocaleDateString('es-CO')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(invoice as any).customers?.name || `Cliente #${invoice.customer_id}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {formatCurrency(Number((invoice as any).sales?.total || 0))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(invoice.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleDownloadPDF(invoice)}
                      disabled={downloadingId === invoice.id}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                      title="Descargar PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEmailModal(invoice)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Enviar por correo"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredInvoices.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay facturas registradas</p>
          </div>
        )}
      </div>

      {/* Config Modal */}
      {showConfigModal && (
        <ConfigModal
          config={config}
          onClose={() => {
            setShowConfigModal(false)
            fetchConfig()
          }}
        />
      )}

      {/* Send Email Modal */}
      {emailTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Enviar recibo por correo</h2>
              <p className="text-sm text-gray-500 mt-1">
                Cuenta de cobro {emailTarget.invoice_number}
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo del cliente
              </label>
              <input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="cliente@gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                type="button"
                onClick={() => {
                  setEmailTarget(null)
                  setEmailTo('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={sendingEmail}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmSendEmail}
                disabled={sendingEmail}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{sendingEmail ? 'Enviando...' : 'Enviar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfigModal({
  config,
  onClose,
}: {
  config: any
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    environment: config?.environment || 'test',
    provider: config?.provider || '',
    resolution_number: config?.resolution_number || '',
    prefix: config?.prefix || '',
    range_from: config?.range_from || 1,
    range_to: config?.range_to || 1000,
    start_date: config?.start_date || '',
    end_date: config?.end_date || '',
    api_key: config?.api_key || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (config) {
        await dianService.updateConfig(formData)
      } else {
        await dianService.createConfig({
          ...formData,
          status: 'incomplete',
        } as any)
      }
      onClose()
    } catch (error) {
      console.error('Error saving config:', error)
      alert('Error al guardar configuración')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Configuración Facturación Electrónica</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ambiente
              </label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="test">Pruebas</option>
                <option value="production">Producción</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor Tecnológico
              </label>
              <input
                type="text"
                required
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Resolución
              </label>
              <input
                type="text"
                required
                value={formData.resolution_number}
                onChange={(e) => setFormData({ ...formData, resolution_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prefijo
              </label>
              <input
                type="text"
                required
                value={formData.prefix}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rango Desde
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.range_from}
                onChange={(e) => setFormData({ ...formData, range_from: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rango Hasta
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.range_to}
                onChange={(e) => setFormData({ ...formData, range_to: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••••••••••"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
