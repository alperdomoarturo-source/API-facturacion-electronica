'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/supabase/client'

export default function SettingsPage() {
  const { isAdmin } = useAuth()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    nit: '',
    address: '',
    phone: '',
    email: '',
    city: '',
  })

  useEffect(() => {
    if (!isAdmin) return
    const load = async () => {
      const { data } = await supabase.from('restaurant').select('*').maybeSingle()
      if (data) {
        setFormData({
          id: data.id,
          name: data.name || '',
          nit: data.nit || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          city: data.city || '',
        })
      }
    }
    load()
  }, [isAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const payload = {
        name: formData.name,
        nit: formData.nit,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        city: formData.city,
        updated_at: new Date().toISOString(),
      }
      const query = formData.id
        ? supabase.from('restaurant').update(payload).eq('id', formData.id)
        : supabase.from('restaurant').insert(payload)
      const { error } = await query
      if (error) throw error
      setMessage('Configuración guardada')
    } catch (err: any) {
      setMessage(err?.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">Acceso denegado.</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
      <p className="text-gray-600 mb-8">Datos del restaurante</p>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
          <input required value={formData.nit} onChange={(e) => setFormData({ ...formData, nit: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        {message && <p className="text-sm text-gray-700">{message}</p>}
        <button disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
