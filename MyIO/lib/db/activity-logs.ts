// lib/db/activity-logs.ts — Common helper to log actions to activity_logs (no logs for list/select).

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

const TABLE = 'myio_activity_logs';

export type LogAction =
  | 'CREATE_USER_PREFERENCE'
  | 'UPDATE_USER_PREFERENCE'
  | 'CREATE_CATEGORY'
  | 'UPDATE_CATEGORY'
  | 'DELETE_CATEGORY'
  | 'CREATE_ACCOUNT'
  | 'UPDATE_ACCOUNT'
  | 'DELETE_ACCOUNT'
  | 'CREATE_TRANSACTION'
  | 'UPDATE_TRANSACTION'
  | 'DELETE_TRANSACTION'
  | 'CREATE_NOTIFICATION'
  | 'UPDATE_NOTIFICATION'
  | 'DELETE_NOTIFICATION';

export type LogParams = {
  userId: string;
  action: LogAction;
  entityType: string;
  entityId: string;
  message: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ipAddress?: string | null;
};

export async function logActivity(params: LogParams): Promise<{ error: Error | null }> {
  const { userId, action, entityType, entityId, message, oldData, newData, ipAddress } = params;
  const { error } = await supabase.from(TABLE).insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    message,
    old_data: oldData ?? null,
    new_data: newData ?? null,
    ip_address: ipAddress ?? null,
  });

  if (error) {
    logger.error('activity_logs insert failed', action, entityType, entityId, error.message);
    return { error: error as Error };
  }
  return { error: null };
}
