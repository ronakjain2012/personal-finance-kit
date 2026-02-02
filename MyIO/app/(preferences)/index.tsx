// app/(preferences)/index.tsx — User preferences: default_currency, theme, language; save then go to home.

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickActionsModal } from '@/components/feature/QuickActionsModal';
import { Header } from '@/components/layout';
import { AppColors } from '@/constants/theme';
import {
    createUserPreference,
    findUserPreference,
    listCurrencies,
    updateUserPreference,
} from '@/lib/db';
import { useAuthUser } from '@/stores';
import type { Currency } from '@/types/database';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
] as const;

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthUser();
  const userId = user?.id ?? '';

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [prefRes, currRes] = await Promise.all([
        findUserPreference(userId),
        listCurrencies(),
      ]);
      if (prefRes.data) {
        setDefaultCurrency(prefRes.data.default_currency);
        setTheme((prefRes.data.theme as 'light' | 'dark' | 'system') || 'system');
        setLanguage(prefRes.data.language || 'en');
      }
      if (currRes.data) setCurrencies(currRes.data);
      setLoading(false);
    })();
  }, [userId]);

  async function handleSave() {
    if (!userId) return;
    setError(null);
    setSaving(true);
    const payload = { default_currency: defaultCurrency, theme, language };
    const existing = await findUserPreference(userId);
    const result = existing.data
      ? await updateUserPreference(userId, payload)
      : await createUserPreference(userId, {
          user_id: userId,
          ...payload,
          default_income_account_id: null,
          default_expense_account_id: null,
          migration_completed: false,
        });
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    router.replace('/(tabs)');
  }

  if (!userId) {
    return null;
  }

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Header
        title="Preferences"
        onAvatarPress={() => setQuickActionsVisible(true)}
      />
      <Text style={styles.subtitle}>Set your default currency, theme, and language.</Text>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Default currency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {currencies.length ? (
            currencies.map((c) => (
              <Pressable
                key={c.code}
                onPress={() => setDefaultCurrency(c.code)}
                style={[
                  styles.chip,
                  defaultCurrency === c.code && styles.chipSelected,
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    defaultCurrency === c.code && styles.chipTextSelected,
                  ]}>
                  {c.code} ({c.symbol})
                </Text>
              </Pressable>
            ))
          ) : (
            <Pressable
              style={[styles.chip, styles.chipSelected]}
              onPress={() => {}}>
              <Text style={[styles.chipText, styles.chipTextSelected]}>USD</Text>
            </Pressable>
          )}
        </ScrollView>

        <Text style={styles.label}>Theme</Text>
        <View style={styles.row}>
          {THEME_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setTheme(opt.value)}
              style={[styles.option, theme === opt.value && styles.optionSelected]}>
              <Text style={[styles.optionText, theme === opt.value && styles.optionTextSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Language</Text>
        <View style={styles.row}>
          {LANGUAGE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setLanguage(opt.value)}
              style={[styles.option, language === opt.value && styles.optionSelected]}>
              <Text style={[styles.optionText, language === opt.value && styles.optionTextSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Save preferences">
        {saving ? (
          <ActivityIndicator color={AppColors.black} />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </Pressable>

      <QuickActionsModal
        visible={quickActionsVisible}
        onClose={() => setQuickActionsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.white,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.gray,
    marginTop: 4,
    marginBottom: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.gray,
    marginBottom: 8,
    marginTop: 16,
  },
  chipRow: {
    flexGrow: 0,
    marginBottom: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: AppColors.gray + '20',
  },
  chipSelected: {
    backgroundColor: AppColors.primary,
  },
  chipText: {
    fontSize: 14,
    color: AppColors.black,
  },
  chipTextSelected: {
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: AppColors.gray + '20',
  },
  optionSelected: {
    backgroundColor: AppColors.primary,
  },
  optionText: {
    fontSize: 14,
    color: AppColors.black,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.black,
  },
});
