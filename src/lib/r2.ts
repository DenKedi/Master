/* ═══════════════════════════════════════════════════════════════════════════
 *  Cloudflare R2 client (S3-compatible)
 *
 *  Required environment variables:
 *    R2_ENDPOINT          — https://<accountId>.r2.cloudflarestorage.com
 *    R2_ACCESS_KEY_ID     — R2 API token access key id
 *    R2_SECRET_ACCESS_KEY — R2 API token secret
 *    R2_BUCKET_NAME       — bucket name
 *    NEXT_PUBLIC_R2_URL   — public CDN base URL (no trailing slash)
 * ═══════════════════════════════════════════════════════════════════════════ */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

function getR2Client(): S3Client {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 environment variables are not configured (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)');
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const BUCKET = process.env.R2_BUCKET_NAME ?? 'master-bucket';
const PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_URL ?? '').replace(/\/$/, '');

/**
 * Upload a buffer to R2 and return the public URL.
 * @param key  Object key, e.g. "cards/goblin-bungler.webp"
 * @param body Buffer or Uint8Array
 * @param contentType MIME type, e.g. "image/webp"
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return `${PUBLIC_URL}/${key}`;
}

/**
 * Delete an object from R2 by key.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** Extract the R2 object key from a public URL. Returns null if not an R2 URL. */
export function r2KeyFromUrl(url: string): string | null {
  if (!PUBLIC_URL || !url.startsWith(PUBLIC_URL)) return null;
  return url.slice(PUBLIC_URL.length + 1); // strip leading slash
}
