'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Receipt, 
  Users, 
  Utensils, 
  Package, 
  Truck, 
  Building2, 
  DollarSign, 
  FileText, 
  BarChart3, 
  Calculator, 
  Settings, 
  LogOut,
  Store
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, isAdmin, isCashier } = useAuth()

  const handleLogout = async () => {
    const { supabase } = await import('@/supabase/client')
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const adminMenuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/pos', icon: ShoppingCart, label: 'POS' },
    { href: '/sales', icon: Receipt, label: 'Ventas' },
    { href: '/invoicing', icon: FileText, label: 'Facturación' },
    { href: '/customers', icon: Users, label: 'Clientes' },
    { href: '/menu', icon: Utensils, label: 'Menú' },
    { href: '/inventory', icon: Package, label: 'Inventario' },
    { href: '/purchases', icon: Truck, label: 'Compras' },
    { href: '/suppliers', icon: Building2, label: 'Proveedores' },
    { href: '/cash', icon: DollarSign, label: 'Caja' },
    { href: '/expenses', icon: Store, label: 'Gastos' },
    { href: '/accounts-receivable', icon: FileText, label: 'Cuentas por cobrar' },
    { href: '/accounts-payable', icon: FileText, label: 'Cuentas por pagar' },
    { href: '/reports', icon: BarChart3, label: 'Reportes' },
    { href: '/accounting', icon: Calculator, label: 'Contabilidad' },
    { href: '/users', icon: Users, label: 'Usuarios' },
    { href: '/settings', icon: Settings, label: 'Configuración' },
  ]

  const cashierMenuItems = [
    { href: '/pos', icon: ShoppingCart, label: 'POS' },
    { href: '/sales', icon: Receipt, label: 'Ventas' },
    { href: '/invoicing', icon: FileText, label: 'Facturación' },
    { href: '/customers', icon: Users, label: 'Clientes' },
    { href: '/cash', icon: DollarSign, label: 'Caja' },
  ]

  const menuItems = isAdmin ? adminMenuItems : isCashier ? cashierMenuItems : []

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">API Software</h1>
        <p className="text-gray-400 text-sm mt-1">
          {profile?.role === 'ADMIN' ? 'Administrador' : 'Cajero'}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            {profile?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.full_name}</p>
            <p className="text-xs text-gray-400 truncate">{profile?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}
