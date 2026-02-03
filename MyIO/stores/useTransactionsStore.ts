// stores/useTransactionsStore.ts — Transactions list; fetch from Supabase, reset on logout.

import { create } from "zustand"

import {
  listTransactions,
  type ListTransactionsOptions,
} from "@/lib/db"
import type { Transaction } from "@/types/database"
import { useReportingStore } from "./useReportingStore"

type TransactionsState = {
  transactions: Transaction[]
  loading: boolean
  error: Error | null
  getTransactions: () => Transaction[]
  getLoading: () => boolean
  getError: () => Error | null
  setTransactions: (tx: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void
  setLoading: (loading: boolean) => void
  setError: (error: Error | null) => void
  fetch: (userId: string, options?: ListTransactionsOptions) => Promise<void>
  reset: () => void
}

const initialState = {
  transactions: [] as Transaction[],
  loading: false,
  error: null as Error | null,
}

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
  ...initialState,

  getTransactions: () => get().transactions,
  getLoading: () => get().loading,
  getError: () => get().error,

  setTransactions: (tx) =>
    set((s) => ({
      transactions: typeof tx === "function" ? tx(s.transactions) : tx,
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetch: async (userId, options = {}) => {
    set({ loading: true, error: null })
    const { data, error } = await listTransactions(userId, {
      limit: options.limit ?? 200,
      ...options,
    })
    set({
      transactions: data ?? [],
      loading: false,
      error: error ?? null,
    })
    useReportingStore.getState().fetch(userId);
  },

  reset: () => set(initialState),
}))
