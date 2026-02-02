// lib/storage.ts — Upload to MyIO bucket; return public URL.

import { supabase } from '@/lib/supabase';

const BUCKET = 'MyIO';

function uniqueId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Upload a file to MyIO bucket at path {userId}/attachments/{id}{ext}.
 * Returns the public URL on success. Bucket must exist and be public (or use RLS).
 */
export async function uploadAttachment(
  userId: string,
  uri: string,
  mimeType: string,
  fileName?: string
): Promise<{ url: string } | { error: Error }> {
  const name = fileName ?? `file_${Date.now()}`;
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
  const path = `${userId}/attachments/${uniqueId()}${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) return { error: error as Error };

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return { url: urlData.publicUrl };
}
