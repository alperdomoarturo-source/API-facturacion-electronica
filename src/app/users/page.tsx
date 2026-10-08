'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/supabase/client'
import { Profile } from '@/types'

export default function UsersPage() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    const load = async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        if (queryError) throw queryError
        setUsers(data || [])
      } catch (err: any) {
        setError(err?.message || 'No se pudieron cargar los usuarios')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">Acceso denegado.</div>
      </div>
    )
  }

  if (loading) return <div className="p-8 text-gray-600">Cargando usuarios...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Usuarios</h1>
      <p className="text-gray-600 mb-8">Perfiles con acceso al sistema</p>
      {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.full_name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{user.role === 'ADMIN' ? 'Administrador' : 'Cajero'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className="p-8 text-center text-gray-500">No hay usuarios registrados</div>}
      </div>
    </div>
  )
}
