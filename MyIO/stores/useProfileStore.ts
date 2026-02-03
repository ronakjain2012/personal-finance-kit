// stores/useProfileStore.ts — Auth user profile; fetch from Supabase, reset on logout.

import type { User } from "@supabase/supabase-js"
import { create } from "zustand"

import { supabase } from "@/lib/supabase"

type ProfileState = {
  profile: User | null
  loading: boolean
  error: Error | null
  getProfile: () => User | null
  getLoading: () => boolean
  getError: () => Error | null
  setProfile: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: Error | null) => void
  fetch: () => Promise<void>
  reset: () => void
}

const initialState = {
  profile: null as User | null,
  loading: false,
  error: null as Error | null,
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  ...initialState,

  getProfile: () => get().profile,
  getLoading: () => get().loading,
  getError: () => get().error,

  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetch: async () => {
    set({ loading: true, error: null })
    const { data: { user }, error } = await supabase.auth.getUser()
    set({
      profile: user ?? null,
      loading: false,
      error: error ?? null,
    })
  },

  reset: () => set(initialState),
}))
