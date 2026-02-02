// lib/db/notifications.ts — Notifications: list, find, create, update, delete. Activity log on create/update/delete; deleted_records on delete.

import { supabase } from '@/lib/supabase';
import type { Notification, NotificationInsert, NotificationUpdate } from '@/types/database';
import { logActivity, type LogAction } from './activity-logs';
import { createDeletedRecord } from './deleted-records';

const TABLE = 'myio_notifications';
const ENTITY_TYPE = 'notifications';

export async function listNotifications(
  userId: string
): Promise<{ data: Notification[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return { data: null, error: error as Error };
  return { data: data as Notification[], error: null };
}

export async function findNotification(
  userId: string,
  id: string
): Promise<{ data: Notification | null; error: Error | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();
  if (error) return { data: null, error: error as Error };
  return { data: data as Notification | null, error: null };
}

export async function createNotification(
  userId: string,
  payload: NotificationInsert
): Promise<{ data: Notification | null; error: Error | null }> {
  const row = { ...payload, user_id: userId };
  const { data, error } = await supabase.from(TABLE).insert(row).select().single();
  if (error) return { data: null, error: error as Error };

  const action: LogAction = 'CREATE_NOTIFICATION';
  await logActivity({
    userId,
    action,
    entityType: ENTITY_TYPE,
    entityId: (data as Notification).id,
    message: `Notification created: ${(data as Notification).title} (${(data as Notification).type})`,
    newData: data as unknown as Record<string, unknown>,
  });

  return { data: data as Notification, error: null };
}

export async function updateNotification(
  userId: string,
  id: string,
  payload: NotificationUpdate
): Promise<{ data: Notification | null; error: Error | null }> {
  const { data: oldRow, error: fetchError } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();
  if (fetchError) return { data: null, error: fetchError as Error };
  if (!oldRow) return { data: null, error: new Error('Notification not found') };

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
    action: 'UPDATE_NOTIFICATION',
    entityType: ENTITY_TYPE,
    entityId: id,
    message: `Notification updated: ${(oldRow as Notification).title} (id: ${id})`,
    oldData: oldRow as unknown as Record<string, unknown>,
    newData: data as unknown as Record<string, unknown>,
  });

  return { data: data as Notification, error: null };
}

export async function deleteNotification(
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
  if (!row) return { error: new Error('Notification not found') };

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
    action: 'DELETE_NOTIFICATION',
    entityType: ENTITY_TYPE,
    entityId: id,
    message: `Notification deleted: ${(row as Notification).title} (id: ${id})`,
    oldData: row as unknown as Record<string, unknown>,
  });

  return { error: null };
}
