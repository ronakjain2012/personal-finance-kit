// lib/db/categories.ts — Categories: list, find, create, update, delete. Activity log on create/update/delete; deleted_records on delete.

import { supabase } from '@/lib/supabase';
import type { Category, CategoryInsert, CategoryUpdate } from '@/types/database';
import { logActivity, type LogAction } from './activity-logs';
import { createDeletedRecord } from './deleted-records';

const TABLE = 'myio_categories';
const ENTITY_TYPE = 'categories';

export async function listCategories(
  userId: string
): Promise<{ data: Category[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return { data: null, error: error as Error };
  return { data: data as Category[], error: null };
}

export async function findCategory(
  userId: string,
  id: string
): Promise<{ data: Category | null; error: Error | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();
  if (error) return { data: null, error: error as Error };
  return { data: data as Category | null, error: null };
}

export async function createCategory(
  userId: string,
  payload: CategoryInsert
): Promise<{ data: Category | null; error: Error | null }> {
  const row = { ...payload, user_id: userId };
  const { data, error } = await supabase.from(TABLE).insert(row).select().single();
  if (error) return { data: null, error: error as Error };

  const action: LogAction = 'CREATE_CATEGORY';
  await logActivity({
    userId,
    action,
    entityType: ENTITY_TYPE,
    entityId: (data as Category).id,
    message: `Category created: ${(data as Category).name} (${(data as Category).type})`,
    newData: data as unknown as Record<string, unknown>,
  });

  return { data: data as Category, error: null };
}

export async function updateCategory(
  userId: string,
  id: string,
  payload: CategoryUpdate
): Promise<{ data: Category | null; error: Error | null }> {
  const { data: oldRow, error: fetchError } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();
  if (fetchError) return { data: null, error: fetchError as Error };
  if (!oldRow) return { data: null, error: new Error('Category not found') };

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
    action: 'UPDATE_CATEGORY',
    entityType: ENTITY_TYPE,
    entityId: id,
    message: `Category updated: ${(oldRow as Category).name} (id: ${id})`,
    oldData: oldRow as unknown as Record<string, unknown>,
    newData: data as unknown as Record<string, unknown>,
  });

  return { data: data as Category, error: null };
}

export async function deleteCategory(
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
  if (!row) return { error: new Error('Category not found') };

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
    action: 'DELETE_CATEGORY',
    entityType: ENTITY_TYPE,
    entityId: id,
    message: `Category deleted: ${(row as Category).name} (id: ${id})`,
    oldData: row as unknown as Record<string, unknown>,
  });

  return { error: null };
}
