// lib/db/currencies.ts — Currencies (reference table): list, find. No activity_logs for list/select.

import { supabase } from '@/lib/supabase';
import type { Currency } from '@/types/database';

const TABLE = 'myio_currencies';

export async function listCurrencies(): Promise<{ data: Currency[] | null; error: Error | null }> {
  const { data, error } = await supabase.from(TABLE).select('*').order('code');
  if (error) return { data: null, error: error as Error };
  return { data: data as Currency[], error: null };
}

export async function findCurrency(
  code: string
): Promise<{ data: Currency | null; error: Error | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('code', code)
    .maybeSingle();
  if (error) return { data: null, error: error as Error };
  return { data: data as Currency | null, error: null };
}
