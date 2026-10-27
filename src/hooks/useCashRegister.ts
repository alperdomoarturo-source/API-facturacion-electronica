'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/supabase/client'
import { CashRegister } from '@/types'

export const CASH_REGISTER_CHANGED = 'cash-register-changed'

export function notifyCashRegisterChange() {
  window.dispatchEvent(new Event(CASH_REGISTER_CHANGED))
}

export function useOpenCashRegister(userId?: string) {
  const [openRegister, setOpenRegister] = useState<CashRegister | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) {
      setOpenRegister(null)
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('cash_registers')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .maybeSingle()

    setOpenRegister(data ?? null)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    const handler = () => {
      void refresh()
    }
    handler()
    window.addEventListener(CASH_REGISTER_CHANGED, handler)
    return () => window.removeEventListener(CASH_REGISTER_CHANGED, handler)
  }, [refresh])

  return { openRegister, loading, refresh }
}
