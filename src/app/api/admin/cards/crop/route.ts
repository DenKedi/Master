import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import CardCropModel from '@/models/CardCrop';
import CardModel from '@/models/Card';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';
import { preRenderCard } from '@/lib/cards/render/prerender';

// GET /api/admin/cards/crop — list all cards from DB + their crop data
export async function GET() {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }

  const allCards = await CardModel.find({ isActive: true })
    .select('cardId name type rarity imageUrl')
    .lean();

  const crops = await CardCropModel.find().lean();
  const cropMap = new Map(crops.map((c) => [c.cardId, c.crop]));

  const result = allCards.map((card) => ({
    cardId: card.cardId,
    name: card.name,
    type: card.type,
    rarity: card.rarity,
    imageUrl: card.imageUrl,
    crop: cropMap.get(card.cardId) ?? null,
  }));

  return apiOk(result);
}

// POST /api/admin/cards/crop — save crop for a card
export async function POST(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }

  const body = await req.json();
  const { cardId, crop } = body;

  if (!cardId || typeof cardId !== 'string') {
    return apiError('cardId is required');
  }

  if (
    !crop ||
    typeof crop.x !== 'number' ||
    typeof crop.y !== 'number' ||
    typeof crop.width !== 'number' ||
    typeof crop.height !== 'number' ||
    crop.width <= 0 ||
    crop.height <= 0
  ) {
    return apiError('Valid crop object { x, y, width, height } required');
  }

  const updated = await CardCropModel.findOneAndUpdate(
    { cardId },
    { crop: { x: crop.x, y: crop.y, width: crop.width, height: crop.height } },
    { upsert: true, new: true },
  );

  // Re-render the card with the new crop (fire & forget)
  preRenderCard(cardId).catch((err) =>
    console.error(`[prerender] Failed after crop save for ${cardId}:`, err),
  );

  return apiOk(updated);
}

// DELETE /api/admin/cards/crop — remove crop for a card (reset to default)
export async function DELETE(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }

  const body = await req.json();
  const { cardId } = body;

  if (!cardId || typeof cardId !== 'string') {
    return apiError('cardId is required');
  }

  await CardCropModel.deleteOne({ cardId });

  // Re-render the card without crop (fire & forget)
  preRenderCard(cardId).catch((err) =>
    console.error(`[prerender] Failed after crop delete for ${cardId}:`, err),
  );

  return apiOk({ deleted: true });
}
