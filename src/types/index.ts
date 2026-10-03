// Database types
export type Role = 'ADMIN' | 'CASHIER'

export interface Restaurant {
  id: string
  name: string
  nit: string
  address: string
  phone: string
  email: string
  city: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  role: Role
  full_name: string
  phone: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  document_type: string
  document_number: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  tax_regime?: string
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  nit: string
  phone: string
  email?: string
  address?: string
  contact_person?: string
  products?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  category_id: string
  name: string
  description?: string
  price: number
  cost: number
  tax_rate_id?: string
  image_url?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Ingredient {
  id: string
  name: string
  code: string
  category: string
  unit: 'unidad' | 'g' | 'kg' | 'ml' | 'litros' | 'caja' | 'paquete'
  current_stock: number
  min_stock: number
  unit_cost: number
  supplier_id?: string
  expiration_date?: string
  created_at: string
  updated_at: string
}

export interface Recipe {
  id: string
  product_id: string
  calculated_cost: number
  created_at: string
  updated_at: string
}

export interface RecipeItem {
  id: string
  recipe_id: string
  ingredient_id: string
  quantity: number
  created_at: string
}

export interface Inventory {
  id: string
  ingredient_id: string
  current_stock: number
  min_stock: number
  unit_cost: number
  last_updated: string
}

export interface InventoryMovement {
  id: string
  ingredient_id: string
  quantity: number
  type: 'purchase' | 'sale' | 'loss' | 'expiration' | 'adjustment' | 'entry' | 'exit'
  reason?: string
  cost?: number
  user_id: string
  created_at: string
}

export interface Purchase {
  id: string
  supplier_id: string
  total: number
  tax: number
  status: 'pending' | 'received' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  ingredient_id: string
  quantity: number
  unit_price: number
  total: number
}

export interface Sale {
  id: string
  customer_id?: string
  subtotal: number
  discount: number
  tax: number
  total: number
  payment_method: 'cash' | 'debit_card' | 'credit_card' | 'transfer' | 'nequi' | 'other'
  status: 'completed' | 'cancelled' | 'refunded'
  cash_register_id?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  total: number
}

export interface Invoice {
  id: string
  sale_id: string
  customer_id: string
  invoice_number: string
  prefix: string
  cufe?: string
  xml?: string
  status: 'pending' | 'sending' | 'accepted' | 'rejected' | 'error'
  dian_response?: string
  error_message?: string
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  product_id: string
  quantity: number
  unit_price: number
  total: number
  tax: number
}

export interface CreditNote {
  id: string
  invoice_id: string
  note_number: string
  reason: string
  amount: number
  status: 'pending' | 'sent' | 'accepted' | 'rejected' | 'error'
  cufe?: string
  created_at: string
  updated_at: string
}

export interface DebitNote {
  id: string
  invoice_id: string
  note_number: string
  reason: string
  amount: number
  status: 'pending' | 'sent' | 'accepted' | 'rejected' | 'error'
  cufe?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  sale_id: string
  amount: number
  payment_method: 'cash' | 'debit_card' | 'credit_card' | 'transfer' | 'nequi' | 'other'
  reference?: string
  created_at: string
}

export interface CashRegister {
  id: string
  user_id: string
  opening_amount: number
  opening_date: string
  closing_date?: string
  closing_amount?: number
  expected_amount?: number
  difference?: number
  status: 'open' | 'closed'
  created_at: string
  updated_at: string
}

export interface CashMovement {
  id: string
  cash_register_id: string
  type: 'entry' | 'exit'
  amount: number
  reason?: string
  user_id: string
  created_at: string
}

export interface Expense {
  id: string
  category: 'rent' | 'services' | 'payroll' | 'advertising' | 'transport' | 'maintenance' | 'equipment' | 'other'
  description: string
  amount: number
  payment_method: 'cash' | 'transfer' | 'card'
  supplier_id?: string
  support_document?: string
  date: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface AccountReceivable {
  id: string
  customer_id: string
  sale_id: string
  amount: number
  paid_amount: number
  balance: number
  due_date: string
  status: 'pending' | 'partial' | 'paid' | 'overdue'
  created_at: string
  updated_at: string
}

export interface AccountPayable {
  id: string
  supplier_id: string
  purchase_id?: string
  amount: number
  paid_amount: number
  balance: number
  due_date: string
  status: 'pending' | 'partial' | 'paid' | 'overdue'
  created_at: string
  updated_at: string
}

export interface TaxRate {
  id: string
  name: string
  rate: number
  type: 'iva' | 'ica' | 'other'
  active: boolean
  created_at: string
  updated_at: string
}

export interface ElectronicInvoicingConfig {
  id: string
  environment: 'test' | 'production'
  provider: string
  resolution_number: string
  prefix: string
  range_from: number
  range_to: number
  start_date: string
  end_date: string
  api_key?: string
  certificate?: string
  status: 'configured' | 'incomplete' | 'error'
  created_at: string
  updated_at: string
}

export interface DIANDocument {
  id: string
  type: 'invoice' | 'credit_note' | 'debit_note'
  document_id: string
  cufe: string
  xml: string
  status: 'pending' | 'accepted' | 'rejected' | 'error'
  response_code?: string
  response_message?: string
  sent_at?: string
  response_at?: string
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity: string
  entity_id: string
  details?: string
  ip_address?: string
  created_at: string
}

// Cart item for POS
export interface CartItem {
  product: Product
  quantity: number
}

// Dashboard stats
export interface DashboardStats {
  today_sales: number
  month_sales: number
  invoices_generated: number
  invoices_accepted: number
  invoices_rejected: number
  inventory_value: number
  expenses: number
  estimated_profit: number
  accounts_receivable: number
  accounts_payable: number
}
