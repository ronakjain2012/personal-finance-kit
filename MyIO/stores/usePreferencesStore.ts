// stores/usePreferencesStore.ts — User preference + currencies; fetch from Supabase, reset on logout.

import { create } from "zustand"

import { findUserPreference, listCurrencies } from "@/lib/db"
import type { Currency, UserPreference } from "@/types/database"

type PreferencesState = {
  preference: UserPreference | null
  currencies: Currency[]
  loading: boolean
  error: Error | null
  getPreference: () => UserPreference | null
  getCurrencies: () => Currency[]
  getLoading: () => boolean
  getError: () => Error | null
  setPreference: (p: UserPreference | null) => void
  setCurrencies: (currencies: Currency[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: Error | null) => void
  fetch: (userId: string) => Promise<void>
  reset: () => void
}

const initialState = {
  preference: null as UserPreference | null,
  currencies: [] as Currency[],
  loading: false,
  error: null as Error | null,
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ...initialState,

  getPreference: () => get().preference,
  getCurrencies: () => get().currencies,
  getLoading: () => get().loading,
  getError: () => get().error,

  setPreference: (p) => set({ preference: p }),
  setCurrencies: (currencies) => set({ currencies }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetch: async (userId) => {
    set({ loading: true, error: null })
    const [prefRes, currRes] = await Promise.all([
      findUserPreference(userId),
      listCurrencies(),
    ])
    set({
      preference: prefRes.data ?? null,
      currencies: currRes.data ?? [],
      loading: false,
      error: prefRes.error ?? currRes.error ?? null,
    })
  },

  reset: () => set(initialState),
}))
