// stores/useAuthStore.ts — Auth state: session, user; persisted via AsyncStorage; integrates Supabase.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { logger } from '@/lib/logger';
import { runLoginCheck } from '@/lib/login-check';
import { supabase } from '@/lib/supabase';
import { useDefaultAccountsStore } from './useDefaultAccountsStore';

export type LoginCredentials = { email: string; password: string };

type AuthState = {
  session: Session | null;
  setSession: (session: Session | null) => void;
  login: (credentials: LoginCredentials) => Promise<{ error: Error | null }>;
  signUp: (credentials: LoginCredentials) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  reset: () => void;
};

const STORAGE_KEY = 'myio-auth-store';

const initialState = { session: null as Session | null };

function logAuthError(operation: string, error: { message?: string; name?: string; status?: number }) {
  logger.error(
    `Auth ${operation} failed`,
    error.name ?? 'Error',
    error.message ?? '',
    typeof error.status === 'number' ? `status=${error.status}` : ''
  );
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      setSession: (session) => set({ session }),

      login: async (credentials) => {
        const { data, error } = await supabase.auth.signInWithPassword(credentials);
        if (error) {
          logAuthError('login', error);
          return { error: error as Error };
        }
        if (__DEV__) {
          logger.debug('Login success', { hasSession: !!data.session, hasUser: !!data.user?.id });
        }
        const result = await runLoginCheck(data.user?.id ?? '');
        if (result.ok) {
          useDefaultAccountsStore.getState().setDefaults(
            result.preference.default_income_account_id ?? null,
            result.preference.default_expense_account_id ?? null
          );
        }

        set({ session: data.session });
        return { error: null };
      },

      signUp: async (credentials) => {
        const { data, error } = await supabase.auth.signUp(credentials);
        if (error) {
          logAuthError('signUp', error);
          return { error: error as Error };
        }
        if (__DEV__) {
          logger.debug('SignUp success', { hasSession: !!data.session, hasUser: !!data.user?.id });
        }
        set({ session: data.session ?? null });
        return { error: null };
      },

      logout: async () => {
        await supabase.auth.signOut();
        set(initialState);
        void AsyncStorage.removeItem(STORAGE_KEY);
        useDefaultAccountsStore.getState().reset();
      },

      reset: () => {
        set(initialState);
        void AsyncStorage.removeItem(STORAGE_KEY);
        useDefaultAccountsStore.getState().reset();
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ session: state.session }),
    }
  )
);

export function useAuthUser() {
  return useAuthStore((state) => state.session?.user ?? null);
}
