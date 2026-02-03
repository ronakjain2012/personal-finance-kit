// stores/useCategoriesStore.ts — Categories list; fetch from Supabase, reset on logout.

import { create } from "zustand"

import { listCategories } from "@/lib/db"
import type { Category } from "@/types/database"

type CategoriesState = {
  categories: Category[]
  loading: boolean
  error: Error | null
  getCategories: () => Category[]
  getLoading: () => boolean
  getError: () => Error | null
  setCategories: (cat: Category[] | ((prev: Category[]) => Category[])) => void
  setLoading: (loading: boolean) => void
  setError: (error: Error | null) => void
  fetch: (userId: string) => Promise<void>
  reset: () => void
}

const initialState = {
  categories: [] as Category[],
  loading: false,
  error: null as Error | null,
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  ...initialState,

  getCategories: () => get().categories,
  getLoading: () => get().loading,
  getError: () => get().error,

  setCategories: (cat) =>
    set((s) => ({
      categories: typeof cat === "function" ? cat(s.categories) : cat,
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetch: async (userId) => {
    set({ loading: true, error: null })
    const { data, error } = await listCategories(userId)
    set({
      categories: data ?? [],
      loading: false,
      error: error ?? null,
    })
  },

  reset: () => set(initialState),
}))
