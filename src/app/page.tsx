import { redirect } from 'next/navigation'
import { createClient } from '@/supabase/server'
import { getSupabasePublicEnv } from '@/supabase/env'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { isConfigured } = getSupabasePublicEnv()
  if (!isConfigured) {
    redirect('/auth/login')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profile?.role === 'CASHIER') {
    redirect('/pos')
  }

  redirect('/dashboard')
}
