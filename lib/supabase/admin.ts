import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

export function createAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Missing SUPABASE service role key or URL in environment")
  }

  return createSupabaseClient(url, key)
}
