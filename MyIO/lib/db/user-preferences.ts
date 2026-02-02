// lib/db/user-preferences.ts — User preferences: find, create, update. Activity log on create/update.

import { nowISO } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';
import type { UserPreference, UserPreferenceInsert, UserPreferenceUpdate } from '@/types/database';
import { logActivity, type LogAction } from './activity-logs';

const TABLE = 'myio_user_preferences';
const ENTITY_TYPE = 'user_preferences';

export async function findUserPreference(
  userId: string
): Promise<{ data: UserPreference | null; error: Error | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return { data: null, error: error as Error };
  return { data: data as UserPreference | null, error: null };
}

export async function createUserPreference(
  userId: string,
  payload: UserPreferenceInsert
): Promise<{ data: UserPreference | null; error: Error | null }> {
  const row = { ...payload, user_id: userId };
  const { data, error } = await supabase.from(TABLE).insert(row).select().single();
  if (error) return { data: null, error: error as Error };

  const action: LogAction = 'CREATE_USER_PREFERENCE';
  await logActivity({
    userId,
    action,
    entityType: ENTITY_TYPE,
    entityId: userId,
    message: `User preference created for user ${userId}`,
    newData: data as unknown as Record<string, unknown>,
  });

  return { data: data as UserPreference, error: null };
}

export async function updateUserPreference(
  userId: string,
  payload: UserPreferenceUpdate
): Promise<{ data: UserPreference | null; error: Error | null }> {
  const { data: oldRow, error: fetchError } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (fetchError) return { data: null, error: fetchError as Error };
  if (!oldRow) return { data: null, error: new Error('User preference not found') };

  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...payload, updated_at: nowISO() })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) return { data: null, error: error as Error };

  await logActivity({
    userId,
    action: 'UPDATE_USER_PREFERENCE',
    entityType: ENTITY_TYPE,
    entityId: userId,
    message: `User preference updated for user ${userId}`,
    oldData: oldRow as unknown as Record<string, unknown>,
    newData: data as unknown as Record<string, unknown>,
  });

  return { data: data as UserPreference, error: null };
}
