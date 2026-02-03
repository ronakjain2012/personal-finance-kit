// stores/useDefaultAccountsStore.ts — Default from/to accounts for transactions; persisted.
// defaultIncomeAccountId = default to_account for INCOME; defaultExpenseAccountId = default from_account for EXPENSES.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type DefaultAccountsState = {
  defaultIncomeAccountId: string | null;
  defaultExpenseAccountId: string | null;
  getDefaultIncomeAccountId: () => string | null;
  getDefaultExpenseAccountId: () => string | null;
  setDefaultIncomeAccountId: (id: string | null) => void;
  setDefaultExpenseAccountId: (id: string | null) => void;
  setDefaults: (incomeId: string | null, expenseId: string | null) => void;
  reset: () => void;
};

const initialState = {
  defaultIncomeAccountId: null as string | null,
  defaultExpenseAccountId: null as string | null,
};

const STORAGE_KEY = 'myio-default-accounts-store';

export const useDefaultAccountsStore = create<DefaultAccountsState>()(
  persist(
    (set, get) => ({
      ...initialState,
      getDefaultIncomeAccountId: () => get().defaultIncomeAccountId,
      getDefaultExpenseAccountId: () => get().defaultExpenseAccountId,
      setDefaultIncomeAccountId: (defaultIncomeAccountId) => set({ defaultIncomeAccountId }),
      setDefaultExpenseAccountId: (defaultExpenseAccountId) => set({ defaultExpenseAccountId }),
      setDefaults: (defaultIncomeAccountId, defaultExpenseAccountId) =>
        set({ defaultIncomeAccountId, defaultExpenseAccountId }),
      reset: () => {
        set(initialState);
        void AsyncStorage.removeItem(STORAGE_KEY);
      },
    }),
    { name: STORAGE_KEY, storage: createJSONStorage(() => AsyncStorage) }
  )
);
