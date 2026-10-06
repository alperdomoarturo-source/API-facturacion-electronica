export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  }
}

/** Values that never crash `createClient` during `next build` / prerender. */
export function getSupabasePublicEnvForClient() {
  const { url, anonKey, isConfigured } = getSupabasePublicEnv()

  return {
    url: url || 'https://placeholder.supabase.co',
    anonKey: anonKey || 'placeholder-anon-key',
    isConfigured,
  }
}
