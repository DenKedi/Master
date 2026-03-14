import { NextRequest } from 'next/server';
import sharp from 'sharp';
import connectDB from '@/lib/mongodb';
import CardModel from '@/models/Card';
import { uploadToR2, deleteFromR2, r2KeyFromUrl } from '@/lib/r2';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';
import { reloadLegacyBase } from '@/lib/cards/sets/legacy-base';
import { clearFontCache } from '@/lib/cards/render/renderCard';
import { preRenderCard } from '@/lib/cards/render/prerender';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

// POST /api/admin/cards/image — upload card artwork to R2
export async function POST(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return apiError('Invalid multipart form data');
  }

  const cardId = formData.get('cardId');
  const file = formData.get('file');

  if (!cardId || typeof cardId !== 'string') {
    return apiError('cardId is required');
  }
  if (!(file instanceof File)) {
    return apiError('file is required');
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return apiError('File must be an image (jpeg, png, webp, gif, avif)');
  }

  const card = await CardModel.findOne({ cardId });
  if (!card) {
    return apiError('Card not found', 404);
  }

  // If there's a previous R2 image, delete the old object
  if (card.imageUrl) {
    const oldKey = r2KeyFromUrl(card.imageUrl);
    if (oldKey) {
      try {
        await deleteFromR2(oldKey);
      } catch {
        // Non-fatal — old object may no longer exist
      }
    }
  }

  // Convert image to WebP before uploading
  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const webpBuffer = await sharp(rawBuffer).webp({ quality: 90 }).toBuffer();

  const key = `cards/${cardId}-${Date.now()}.webp`;
  const publicUrl = await uploadToR2(key, webpBuffer, 'image/webp');

  await CardModel.updateOne(
    { cardId },
    { $set: { imageUrl: publicUrl } },
  );

  // Clear all render caches so the new image is picked up immediately
  reloadLegacyBase();
  clearFontCache();

  // Pre-render the card with the new image and upload to R2 (fire & forget)
  preRenderCard(cardId as string).catch((err) =>
    console.error(`[prerender] Failed after image upload for ${cardId}:`, err),
  );

  return apiOk({ imageUrl: publicUrl });
}
