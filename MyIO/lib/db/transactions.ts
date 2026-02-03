// lib/db/transactions.ts — Transactions: list, find, create, update, delete. Activity log on create/update/delete; deleted_records on delete.

import { supabase } from '@/lib/supabase';
import type { Transaction, TransactionInsert, TransactionUpdate } from '@/types/database';
import { logActivity, type LogAction } from './activity-logs';
import { createDeletedRecord } from './deleted-records';

const TABLE = 'myio_transactions';
const ENTITY_TYPE = 'transactions';

export type ListTransactionsOptions = {
  fromAccountId?: string;
  toAccountId?: string;
  categoryId?: string;
  entryType?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  addedBy?: string;
  limit?: number;
  offset?: number;
};

export async function listTransactions(
  userId: string,
  options: ListTransactionsOptions = {}
): Promise<{ data: Transaction[] | null; error: Error | null }> {
  let q = supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (options.fromAccountId) q = q.eq('from_account_id', options.fromAccountId);
  if (options.toAccountId) q = q.eq('to_account_id', options.toAccountId);
  if (options.categoryId) q = q.eq('category_id', options.categoryId);
  if (options.entryType) q = q.eq('entry_type', options.entryType);
  if (options.status) q = q.eq('status', options.status);
  if (options.fromDate) q = q.gte('transaction_date', options.fromDate);
  if (options.toDate) q = q.lte('transaction_date', options.toDate);
  if (options.addedBy) q = q.eq('added_by', options.addedBy);
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  q = q.range(offset, offset + limit - 1);

  const { data, error } = await q;
  if (error) return { data: null, error: error as Error };
  return { data: data as Transaction[], error: null };
}

export async function findTransaction(
  userId: string,
  id: string
): Promise<{ data: Transaction | null; error: Error | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();
  if (error) return { data: null, error: error as Error };
  return { data: data as Transaction | null, error: null };
}

export async function createTransaction(
  userId: string,
  payload: TransactionInsert
): Promise<{ data: Transaction | null; error: Error | null }> {
  const row = { ...payload, user_id: userId };
  const { data, error } = await supabase.from(TABLE).insert(row).select().single();
  if (error) return { data: null, error: error as Error };

  const action: LogAction = 'CREATE_TRANSACTION';
  const t = data as Transaction;
  await logActivity({
    userId,
    action,
    entityType: ENTITY_TYPE,
    entityId: t.id,
    message: `Transaction created: ${t.entry_type} amount ${t.amount} (id: ${t.id})`,
    newData: data as unknown as Record<string, unknown>,
  });

  return { data: data as Transaction, error: null };
}

export async function updateTransaction(
  userId: string,
  id: string,
  payload: TransactionUpdate
): Promise<{ data: Transaction | null; error: Error | null }> {
  const { data: oldRow, error: fetchError } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();
  if (fetchError) return { data: null, error: fetchError as Error };
  if (!oldRow) return { data: null, error: new Error('Transaction not found') };

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) return { data: null, error: error as Error };

  await logActivity({
    userId,
    action: 'UPDATE_TRANSACTION',
    entityType: ENTITY_TYPE,
    entityId: id,
    message: `Transaction updated (id: ${id})`,
    oldData: oldRow as unknown as Record<string, unknown>,
    newData: data as unknown as Record<string, unknown>,
  });

  return { data: data as Transaction, error: null };
}

export async function deleteTransaction(
  userId: string,
  id: string
): Promise<{ error: Error | null }> {
  const { data: row, error: fetchError } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();
  if (fetchError) return { error: fetchError as Error };
  if (!row) return { error: new Error('Transaction not found') };

  const { error: deletedErr } = await createDeletedRecord({
    userId,
    tableName: TABLE,
    originalId: id,
    data: row as unknown as Record<string, unknown>,
  });
  if (deletedErr) return { error: deletedErr };

  const { error: deleteError } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (deleteError) return { error: deleteError as Error };

  await logActivity({
    userId,
    action: 'DELETE_TRANSACTION',
    entityType: ENTITY_TYPE,
    entityId: id,
    message: `Transaction deleted (id: ${id})`,
    oldData: row as unknown as Record<string, unknown>,
  });

  return { error: null };
}
