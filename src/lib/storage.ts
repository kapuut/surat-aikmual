/**
 * Unified file storage utility.
 * - Production (Vercel): uses @vercel/blob (requires BLOB_READ_WRITE_TOKEN env var)
 * - Development: falls back to local filesystem under public/
 */

import { put } from '@vercel/blob';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/**
 * Upload a file buffer and return its public URL.
 *
 * @param storagePath  Path relative to storage root, e.g. "uploads/surat-masuk/file.pdf"
 * @param buffer       File contents as Buffer
 * @param contentType  Optional MIME type
 * @returns            Public URL (blob URL in prod, "/storagePath" in dev)
 */
export async function uploadFile(
  storagePath: string,
  buffer: Buffer,
  contentType?: string
): Promise<string> {
  if (USE_BLOB) {
    const blob = await put(storagePath, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  // Local dev — write to public/ folder
  const localPath = path.join(process.cwd(), 'public', storagePath);
  await mkdir(path.dirname(localPath), { recursive: true });
  await writeFile(localPath, buffer);
  return `/${storagePath}`;
}

/**
 * Upload a text file (e.g. generated HTML surat) and return its public URL.
 */
export async function uploadText(
  storagePath: string,
  content: string,
  contentType = 'text/html; charset=utf-8'
): Promise<string> {
  return uploadFile(storagePath, Buffer.from(content, 'utf-8'), contentType);
}

/**
 * Generate a unique storage path using a timestamp + random suffix.
 * Example: uniqueStoragePath("uploads/surat-masuk", "file.pdf")
 *          → "uploads/surat-masuk/1714300000000_a3f2.pdf"
 */
export function uniqueStoragePath(folder: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || '';
  const safe = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_.()\- ]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60)
    .trim() || 'file';
  const rand = Math.random().toString(36).slice(2, 6);
  return `${folder}/${Date.now()}_${rand}_${safe}${ext}`;
}
