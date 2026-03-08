import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import CardModel from '@/models/Card';
import CollectionModel from '@/models/Collection';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';

// GET /api/cards — List all active cards (optionally filter by rarity/type/tier)
export async function GET(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  const { searchParams } = new URL(req.url);
  const rarity = searchParams.get('rarity');
  const type = searchParams.get('type');
  const tier = searchParams.get('tier');
  const characterType = searchParams.get('characterType');
  const mine = searchParams.get('mine'); // "true" = only owned cards

  if (mine === 'true') {
    const userId = (session.user as any).id;
    const entries = await CollectionModel.find({ userId })
      .populate('cardId')
      .lean();
    return apiOk(entries);
  }

  const filter: Record<string, unknown> = { isActive: true };
  if (rarity) filter.rarity = rarity;
  if (type) filter.type = type;
  if (tier) filter.tier = tier;
  if (characterType) filter.characterType = characterType;

  const cards = await CardModel.find(filter)
    .lean()
    .sort({ rarity: 1, name: 1 });
  return apiOk(cards);
}

// POST /api/cards — Admin: create a card
export async function POST(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }

  const body = await req.json();
  const {
    name,
    description,
    rarity,
    type,
    tier,
    imageUrl,
    cost,
    attack,
    defense,
    effect,
    tags,
    characterType,
  } = body;

  if (
    !name ||
    !description ||
    !rarity ||
    !type ||
    !imageUrl ||
    cost === undefined ||
    attack === undefined ||
    defense === undefined
  ) {
    return apiError('Missing required fields');
  }
  const card = await CardModel.create({
    name,
    description,
    rarity,
    type,
    tier: tier || 'base',
    imageUrl,
    cost,
    attack,
    defense,
    effect,
    tags,
    characterType: type === 'character' ? characterType : undefined,
  });
  return apiOk(card, 201);
}
