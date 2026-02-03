// stores/useAppStore.ts — App-wide state: theme, onboarding; persisted via AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

type AppState = {
  theme: Theme;
  onboardingDone: boolean;
  getTheme: () => Theme;
  getOnboardingDone: () => boolean;
  setTheme: (theme: Theme) => void;
  setOnboardingDone: (done: boolean) => void;
  reset: () => void;
};

const initialState = { theme: 'system' as const, onboardingDone: false };

const STORAGE_KEY = 'myio-app-store';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      getTheme: () => get().theme,
      getOnboardingDone: () => get().onboardingDone,
      setTheme: (theme) => set({ theme }),
      setOnboardingDone: (onboardingDone) => set({ onboardingDone }),
      reset: () => {
        set(initialState);
        void AsyncStorage.removeItem(STORAGE_KEY);
      },
    }),
    { name: STORAGE_KEY, storage: createJSONStorage(() => AsyncStorage) }
  )
);
