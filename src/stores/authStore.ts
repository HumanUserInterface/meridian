import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean

  // Actions
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return

    console.log('[Auth] Initializing...');
    const supabase = createClient()

    // Get initial session
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('[Auth] Session result:', { hasSession: !!session, error: error?.message });
      set({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isInitialized: true,
      })
    } catch (err) {
      console.error('[Auth] Error getting session:', err);
      set({
        user: null,
        session: null,
        isLoading: false,
        isInitialized: true,
      })
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        session,
        isLoading: false,
      })
    })
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true })
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (data?.session) {
      set({
        user: data.session.user,
        session: data.session,
        isLoading: false,
      })
    } else {
      set({ isLoading: false })
    }

    return { error }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true })
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    set({ isLoading: false })
    return { error }
  },

  signOut: async () => {
    set({ isLoading: true })
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null, session: null, isLoading: false })
  },

  resetPassword: async (email: string) => {
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    return { error }
  },
}))
