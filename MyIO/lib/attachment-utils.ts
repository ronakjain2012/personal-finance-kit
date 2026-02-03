// lib/attachment-utils.ts — Helpers for attachment display and validation (images + PDF only).

export type AttachmentItem = {
  url: string
  name: string
  isImage: boolean
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)$/i
const PDF_EXT = /\.pdf$/i

/** Allowed MIME types: images and PDF only. */
export function isAllowedMime(mimeType: string | undefined): boolean {
  if (!mimeType) return false
  return (
    mimeType.startsWith("image/") || mimeType === "application/pdf"
  )
}

/** Derive display info from a stored URL (e.g. when loading from DB). */
export function getAttachmentDisplayFromUrl(url: string): AttachmentItem {
  const path = decodeURIComponent(url.split("?")[0] ?? "")
  const filename = path.split("/").pop() ?? "Document"
  const isImage = IMAGE_EXT.test(filename)
  const name = filename.length > 30 ? filename.slice(0, 27) + "…" : filename
  return { url, name, isImage }
}

/** Build attachment item from upload result and picker file. */
export function toAttachmentItem(
  url: string,
  fileName: string,
  mimeType: string | undefined
): AttachmentItem {
  const isImage = mimeType?.startsWith("image/") ?? false
  const name = fileName.length > 30 ? fileName.slice(0, 27) + "…" : fileName
  return { url, name, isImage }
}

/** Document picker type filter: images and PDF only. */
export const ATTACHMENT_PICKER_TYPES = ["image/*", "application/pdf"] as const
