// lib/db/accounts.ts — Accounts: list, find, create, update, delete. Activity log on create/update/delete; deleted_records on delete.

import { nowISO } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';
import type { Account, AccountInsert, AccountUpdate } from '@/types/database';
import { logActivity, type LogAction } from './activity-logs';
import { createDeletedRecord } from './deleted-records';

const TABLE = 'myio_accounts';
const ENTITY_TYPE = 'accounts';

export async function listAccounts(
  userId: string
): Promise<{ data: Account[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return { data: null, error: error as Error };
  return { data: data as Account[], error: null };
}

export async function findAccount(
  userId: string,
  id: string
): Promise<{ data: Account | null; error: Error | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();
  if (error) return { data: null, error: error as Error };
  return { data: data as Account | null, error: null };
}

export async function createAccount(
  userId: string,
  payload: AccountInsert
): Promise<{ data: Account | null; error: Error | null }> {
  const row = { ...payload, user_id: userId };
  const { data, error } = await supabase.from(TABLE).insert(row).select().single();
  if (error) return { data: null, error: error as Error };

  const action: LogAction = 'CREATE_ACCOUNT';
  await logActivity({
    userId,
    action,
    entityType: ENTITY_TYPE,
    entityId: (data as Account).id,
    message: `Account created: ${(data as Account).name} (${(data as Account).type})`,
    newData: data as unknown as Record<string, unknown>,
  });

  return { data: data as Account, error: null };
}

export async function updateAccount(
  userId: string,
  id: string,
  payload: AccountUpdate
): Promise<{ data: Account | null; error: Error | null }> {
  const { data: oldRow, error: fetchError } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();
  if (fetchError) return { data: null, error: fetchError as Error };
  if (!oldRow) return { data: null, error: new Error('Account not found') };

  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...payload, updated_at: nowISO() })
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) return { data: null, error: error as Error };

  await logActivity({
    userId,
    action: 'UPDATE_ACCOUNT',
    entityType: ENTITY_TYPE,
    entityId: id,
    message: `Account updated: ${(oldRow as Account).name} (id: ${id})`,
    oldData: oldRow as unknown as Record<string, unknown>,
    newData: data as unknown as Record<string, unknown>,
  });

  return { data: data as Account, error: null };
}

export async function deleteAccount(
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
  if (!row) return { error: new Error('Account not found') };

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
    action: 'DELETE_ACCOUNT',
    entityType: ENTITY_TYPE,
    entityId: id,
    message: `Account deleted: ${(row as Account).name} (id: ${id})`,
    oldData: row as unknown as Record<string, unknown>,
  });

  return { error: null };
}
