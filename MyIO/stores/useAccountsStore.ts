// stores/useAccountsStore.ts — Accounts list; fetch from Supabase, reset on logout.

import { create } from "zustand"

import { listAccounts } from "@/lib/db"
import type { Account } from "@/types/database"

type AccountsState = {
  accounts: Account[]
  loading: boolean
  error: Error | null
  getAccounts: () => Account[]
  getLoading: () => boolean
  getError: () => Error | null
  setAccounts: (acc: Account[] | ((prev: Account[]) => Account[])) => void
  setLoading: (loading: boolean) => void
  setError: (error: Error | null) => void
  fetch: (userId: string) => Promise<void>
  reset: () => void
}

const initialState = {
  accounts: [] as Account[],
  loading: false,
  error: null as Error | null,
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  ...initialState,

  getAccounts: () => get().accounts,
  getLoading: () => get().loading,
  getError: () => get().error,

  setAccounts: (acc) =>
    set((s) => ({
      accounts: typeof acc === "function" ? acc(s.accounts) : acc,
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetch: async (userId) => {
    set({ loading: true, error: null })
    const { data, error } = await listAccounts(userId)
    set({
      accounts: data ?? [],
      loading: false,
      error: error ?? null,
    })
  },

  reset: () => set(initialState),
}))
