'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/supabase/client'

type OtpType = 'signup' | 'recovery' | 'email'

function ConfirmContent() {
  const params = useSearchParams()
  const [status, setStatus] = useState('Confirmando tu correo...')

  useEffect(() => {
    let cancelled = false

    const finish = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('La sesión no quedó activa. Inicia sesión manualmente.')
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      const { data: openRegister } = await supabase
        .from('cash_registers')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .maybeSingle()

      window.location.assign(
        openRegister || profile?.role === 'CASHIER' ? '/pos' : '/dashboard'
      )
    }

    const run = async () => {
      const code = params.get('code')
      const tokenHash = params.get('token_hash')
      const type = (params.get('type') ?? 'signup') as OtpType

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
          if (error) throw error
        } else {
          // detectSessionInUrl ya pudo tomar la sesión desde el fragment; si no
          // hay nada de esto, el enlace llegó truncado.
          const { data } = await supabase.auth.getSession()
          if (!data.session) {
            throw new Error(
              'El enlace de verificación llegó sin token. Regístrate de nuevo o usa "¿Olvidaste tu contraseña?".'
            )
          }
        }

        if (cancelled) return
        setStatus('Correo verificado. Entrando...')
        await finish()
      } catch (error: unknown) {
        if (cancelled) return
        setStatus(
          error instanceof Error
            ? error.message
            : 'No se pudo verificar el correo.'
        )
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [params])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h2 className="text-2xl font-extrabold text-gray-900">API Software</h2>
        <p className="text-sm text-gray-600">{status}</p>
        <a href="/auth/login" className="text-sm text-blue-600 hover:text-blue-500">
          Volver a iniciar sesión
        </a>
      </div>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmContent />
    </Suspense>
  )
}
