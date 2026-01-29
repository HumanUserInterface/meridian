import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton client instance
let clientInstance: SupabaseClient | null = null
let authInitialized = false
let initPromise: Promise<void> | null = null

function getClientInstance(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storageKey: 'meridian-auth',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    )
  }
  return clientInstance
}

// Initialize auth and wait for session to be loaded
async function ensureAuthInitialized(): Promise<void> {
  if (authInitialized) return

  if (initPromise) {
    await initPromise
    return
  }

  initPromise = (async () => {
    const client = getClientInstance()
    // This call ensures the session is loaded from storage
    await client.auth.getSession()
    authInitialized = true
    console.log('[Supabase] Auth initialized')
  })()

  await initPromise
}

// Export a function that returns the singleton client
export function createClient(): SupabaseClient {
  return getClientInstance()
}

// Export a function to get an initialized client (waits for auth)
export async function getAuthenticatedClient(): Promise<SupabaseClient> {
  await ensureAuthInitialized()
  return getClientInstance()
}
