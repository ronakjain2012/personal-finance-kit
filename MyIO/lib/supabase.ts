// lib/supabase.ts — Supabase client for MyIO; auth persisted via AsyncStorage so session survives reload.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { logger } from '@/lib/logger';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

if (__DEV__ && (!supabaseUrl || !supabaseAnonKey)) {
  logger.error(
    'Supabase env missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env, then restart Expo (npx expo start --clear). Use the anon public key, not service_role.'
  );
}

// Auth debug: log Supabase auth internals in dev (no PII)
const authDebug: false | ((message: string, ...args: unknown[]) => void) =
  __DEV__
    ? (message: string, ...args: unknown[]) => {
        logger.debug(`[Supabase Auth] ${message}`, ...args);
      }
    : false;

if (__DEV__) {
  logger.debug('Supabase init', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    platform: Platform.OS,
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // lock: processLock,
    debug: authDebug,
  },
});

// React Native: control token refresh by app state so session stays valid
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}