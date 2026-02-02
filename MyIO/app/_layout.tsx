// app/_layout.tsx â€” Root layout: theme, splash flow, auth check, initial route.

import '../global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { findUserPreference } from '@/lib/db';
import { logger } from '@/lib/logger';
import { runLoginCheck } from '@/lib/login-check';
import { supabase } from '@/lib/supabase';
import { useAuthStore, useDefaultAccountsStore } from '@/stores';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function useInitialRoute() {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    let mounted = true;

    async function init() {
      await new Promise((r) => setTimeout(r, 50));
      const { data } = await supabase.auth.getSession();
      const session = data.session ?? null;
      if (mounted) setSession(session);

      supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (mounted) setSession(nextSession ?? null);
      });

      if (session) {
        const { data: pref } = await findUserPreference(session.user.id);
        if (!mounted) return;
        if (!pref) {
          (router.replace as (href: string) => void)('/(preferences)');
        } else {
          const result = await runLoginCheck(session.user.id);
          if (mounted) {
            if (result.ok) {
              useDefaultAccountsStore.getState().setDefaults(
                result.preference.default_income_account_id ?? null,
                result.preference.default_expense_account_id ?? null
              );
            } else if (pref.default_income_account_id != null || pref.default_expense_account_id != null) {
              useDefaultAccountsStore.getState().setDefaults(
                pref.default_income_account_id ?? null,
                pref.default_expense_account_id ?? null
              );
            }
            (router.replace as (href: string) => void)('/(tabs)');
          }
        }
      } else {
        useDefaultAccountsStore.getState().reset();
        (router.replace as (href: string) => void)('/(onboarding)');
      }
      logger.debug('Splash: route decided', { hasSession: !!session });
      SplashScreen.hideAsync();
    }

    void init();
    return () => {
      mounted = false;
    };
  }, [setSession]);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useInitialRoute();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(preferences)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
