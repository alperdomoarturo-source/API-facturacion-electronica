'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [supabaseReady, setSupabaseReady] = useState(false)

  useEffect(() => {
    // Check if Supabase is initialized
    if (supabase) {
      console.log('Supabase client initialized')
      setSupabaseReady(true)
    } else {
      console.error('Supabase client not initialized')
      setError('Error: Supabase no está configurado. Verifica las variables de entorno.')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    console.log('handleLogin called')
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!supabase) {
      setError('Error: Supabase no está configurado')
      setLoading(false)
      return
    }

    try {
      console.log('Attempting login with:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Auth response:', { data, error })

      if (error) {
        console.error('Login error:', error)
        throw error
      }

      console.log('Login successful, user:', data.user)
      console.log('Session:', data.session)
      
      // Force page reload to ensure session is set
      window.location.href = '/dashboard'
    } catch (err: any) {
      console.error('Login failed:', err)
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            API Software
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inicia sesión en tu cuenta
          </p>
        </div>
        
        {!supabaseReady && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            Verificando configuración de Supabase...
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={(e) => {
          console.log('Form submitted')
          handleLogin(e)
        }}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !supabaseReady}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <a
              href="/auth/reset-password"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ¿Olvidaste tu contraseña?
            </a>
            <br />
            <a
              href="/auth/signup"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ¿No tienes cuenta? Regístrate
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
