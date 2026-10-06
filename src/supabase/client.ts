import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicEnvForClient } from '@/supabase/env'

type BrowserClient = ReturnType<typeof createBrowserClient>

let browserClient: BrowserClient | undefined

function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient
  }

  const { url, anonKey, isConfigured } = getSupabasePublicEnvForClient()

  if (!isConfigured && typeof window !== 'undefined') {
    console.error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Agrégalas en Vercel → Settings → Environment Variables (Production y Preview) y vuelve a desplegar.'
    )
  }

  browserClient = createBrowserClient(url, anonKey)
  return browserClient
}

export const supabase = new Proxy({} as BrowserClient, {
  get(_target, prop) {
    const client = getSupabaseBrowserClient()
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
