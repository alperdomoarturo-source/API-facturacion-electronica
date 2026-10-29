'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/supabase/client'
import { Profile, Role } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async (userId: string) => {
      // Un perfil nulo no significa "cajero": puede ser que la fila no exista o que
      // RLS la esté rechazando; el error separa los dos casos.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) console.error('[useAuth] consulta de profiles falló', error)
      setProfile(data)
      setProfileError(error ? error.message : data ? null : 'No existe una fila en profiles para este usuario')
    }

    // Get initial session
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user) await loadProfile(user.id)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
        setProfileError(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const isAdmin = profile?.role === 'ADMIN'
  const isCashier = profile?.role === 'CASHIER'

  return {
    user,
    profile,
    profileError,
    loading,
    isAdmin,
    isCashier,
    role: profile?.role as Role,
  }
}
