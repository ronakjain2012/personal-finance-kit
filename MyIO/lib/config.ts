// lib/config.ts — Central env and app config; single place for EXPO_PUBLIC_* and constants.

export const config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
} as const;

export { Colors, Fonts } from '@/constants/theme';

