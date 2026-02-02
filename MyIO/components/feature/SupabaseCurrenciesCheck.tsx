// components/feature/SupabaseCurrenciesCheck.tsx — Fetches currencies from Supabase to verify DB connection.

import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/theme';
import { listCurrencies } from '@/lib/db';

type Status = 'loading' | 'ok' | 'error';

export function SupabaseCurrenciesCheck() {
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    listCurrencies()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setStatus('error');
          setMessage(error.message ?? 'Request failed');
          return;
        }
        setStatus('ok');
        const count = data?.length ?? 0;
        const codes = data?.slice(0, 5).map((c) => c.code).join(', ') ?? '';
        setMessage(count ? `${count} currencies (e.g. ${codes})` : 'No currencies');
      })
      .catch((e) => {
        if (mounted) {
          setStatus('error');
          setMessage(e instanceof Error ? e.message : 'Unknown error');
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.wrapper}>
      {status === 'loading' && (
        <View style={styles.row}>
          <ActivityIndicator size="small" color={AppColors.gray} />
          <Text style={styles.label}>Supabase:</Text>
          <Text style={styles.text}>Checking…</Text>
        </View>
      )}
      {status === 'ok' && (
        <View style={styles.row}>
          <View style={[styles.dot, styles.dotOk]} />
          <Text style={styles.label}>Supabase:</Text>
          <Text style={styles.textOk}>{message}</Text>
        </View>
      )}
      {status === 'error' && (
        <View style={styles.row}>
          <View style={[styles.dot, styles.dotError]} />
          <Text style={styles.label}>Supabase:</Text>
          <Text style={styles.textError}>{message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: AppColors.gray + '18',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOk: {
    backgroundColor: '#22c55e',
  },
  dotError: {
    backgroundColor: '#ef4444',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.gray,
  },
  text: {
    fontSize: 12,
    color: AppColors.gray,
  },
  textOk: {
    fontSize: 12,
    color: AppColors.black,
  },
  textError: {
    fontSize: 12,
    color: '#b91c1c',
  },
});
