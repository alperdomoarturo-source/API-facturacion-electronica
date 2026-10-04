'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    console.log('=== Login attempt started ===')
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      console.log('Email:', email)
      console.log('Password length:', password.length)
      
      if (!email || !password) {
        setError('Por favor completa todos los campos')
        setLoading(false)
        return
      }

      console.log('Calling Supabase auth...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Auth result:', { data, error })

      if (error) {
        console.error('Auth error:', error)
        setError(error.message || 'Error al iniciar sesión')
        setLoading(false)
        return
      }

      if (data?.user) {
        console.log('Login successful!')
        setMessage('¡Login exitoso! Redirigiendo...')
        
        // Wait a moment for session to be set
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Use window.location.replace for hard redirect
        window.location.replace('/dashboard')
      } else {
        setError('No se pudo iniciar sesión')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Unexpected error:', err)
      setError(err.message || 'Error inesperado al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            API Software
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inicia sesión en tu cuenta
          </p>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
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
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <br />
            <br />
            {message && (
              <a
                href="/dashboard"
                className="text-sm font-medium text-green-600 hover:text-green-500 underline"
              >
                Ir al Dashboard (si iniciaste sesión)
              </a>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
