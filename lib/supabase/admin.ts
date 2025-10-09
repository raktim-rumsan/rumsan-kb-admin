import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

export function createAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Missing SUPABASE service role key or URL in environment")
  }

  // Temporary masked debug: confirm the service role key is available at runtime.
  // DO NOT log the full key in production or commit this change. Remove after debugging.
  try {
    const masked = key ? `${key.slice(0, 4)}...${key.slice(-4)}` : 'missing'
    // eslint-disable-next-line no-console
    console.log('SUPABASE_SERVICE_ROLE_KEY present=', !!key, 'len=', key ? key.length : 0, 'mask=', masked)
  } catch {
    // ignore
  }

  return createSupabaseClient(url, key)
}
