// lib/db/deleted-records.ts — Common helper to store deleted row in deleted_records (recycle bin).

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

const TABLE = 'myio_deleted_records';

export type DeletedRecordParams = {
  userId: string;
  tableName: string;
  originalId: string;
  data: Record<string, unknown>;
};

export async function createDeletedRecord(
  params: DeletedRecordParams
): Promise<{ error: Error | null }> {
  const { userId, tableName, originalId, data } = params;
  const { error } = await supabase.from(TABLE).insert({
    user_id: userId,
    table_name: tableName,
    original_id: originalId,
    data,
  });

  if (error) {
    logger.error('deleted_records insert failed', tableName, originalId, error.message);
    return { error: error as Error };
  }
  return { error: null };
}
