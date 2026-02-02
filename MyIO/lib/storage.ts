// lib/storage.ts — Upload to MyIO bucket; return public URL.
// Uses expo-file-system/legacy + base64-arraybuffer so file:// URIs work in React Native (fetch fails with network error).

import { decode } from "base64-arraybuffer"
import {
    EncodingType,
    readAsStringAsync,
} from "expo-file-system/legacy"

import { supabase } from "@/lib/supabase"

const BUCKET = "MyIO"

function uniqueId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Upload a file to MyIO bucket at path {userId}/attachments/{id}{ext}.
 * Returns the public URL on success. Bucket must exist and be public (or use RLS).
 * Reads file via expo-file-system legacy API (works with file:// and content:// URIs in RN).
 */
export async function uploadAttachment(
  userId: string,
  uri: string,
  mimeType: string,
  fileName?: string
): Promise<{ url: string } | { error: Error }> {
  const name = fileName ?? `file_${Date.now()}`
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : ""
  const path = `${userId}/attachments/${uniqueId()}${ext}`

  try {
    const base64 = await readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    })
    const arrayBuffer = decode(base64)

    const { data, error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
      contentType: mimeType,
      upsert: false,
    })

    if (error) return { error: error as Error }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
    return { url: urlData.publicUrl }
  } catch (e) {
    return {
      error: e instanceof Error ? e : new Error(String(e)),
    }
  }
}
