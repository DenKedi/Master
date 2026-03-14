import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import CardModel from '@/models/Card';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';
import { preRenderCard } from '@/lib/cards/render/prerender';

const VALID_RARITIES = ['normal', 'nice', 'special', 'uiiiii', 'unknown'];

// GET /api/admin/cards — list all cards (active + inactive) with full metadata
export async function GET() {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }

  const cards = await CardModel.find({})
    .sort({ name: 1 })
    .lean();

  return apiOk(cards);
}

// PATCH /api/admin/cards — update a card's admin-editable fields
export async function PATCH(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }

  const body = await req.json();
  const { cardId, ...updates } = body;

  if (!cardId || typeof cardId !== 'string') {
    return apiError('cardId is required');
  }

  // Only allow updating admin-editable fields
  const allowed: Record<string, unknown> = {};

  if (typeof updates.name === 'string' && updates.name.trim()) {
    allowed.name = updates.name.trim();
  }
  if (typeof updates.description === 'string') {
    allowed.description = updates.description;
  }
  if (typeof updates.rarity === 'string' && VALID_RARITIES.includes(updates.rarity)) {
    allowed.rarity = updates.rarity;
  }
  if (typeof updates.attack === 'number' && Number.isFinite(updates.attack) && updates.attack >= 0) {
    allowed.attack = updates.attack;
  }
  if (typeof updates.defense === 'number' && Number.isFinite(updates.defense) && updates.defense >= 0) {
    allowed.defense = updates.defense;
  }
  if (typeof updates.price === 'number' && Number.isFinite(updates.price) && updates.price >= 0) {
    allowed.price = updates.price;
  }
  if (Array.isArray(updates.tags) && updates.tags.every((t: unknown) => typeof t === 'string')) {
    allowed.tags = updates.tags.map((t: string) => t.trim()).filter(Boolean);
  }
  if (typeof updates.isActive === 'boolean') {
    allowed.isActive = updates.isActive;
  }
  if (typeof updates.isFeatured === 'boolean') {
    allowed.isFeatured = updates.isFeatured;
  }
  if (Object.keys(allowed).length === 0) {
    return apiError('No valid fields to update');
  }

  const updated = await CardModel.findOneAndUpdate(
    { cardId },
    { $set: allowed },
    { new: true },
  ).lean();

  if (!updated) {
    return apiError('Card not found', 404);
  }

  // Re-render if any visual field changed
  const visualFields = ['name', 'description', 'attack', 'defense', 'rarity'];
  if (visualFields.some((f) => f in allowed)) {
    preRenderCard(cardId).catch((err) =>
      console.error(`[prerender] Failed after PATCH for ${cardId}:`, err),
    );
  }

  return apiOk(updated);
}
