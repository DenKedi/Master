import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import DeckModel from '@/models/Deck';
import CollectionModel from '@/models/Collection';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';
import { DECK_SIZE } from '@/lib/battle/constants';

// ─── GET /api/decks — List all decks for the current user ────────────────────
export async function GET() {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  const userId = (session.user as any).id;
  const decks = await DeckModel.find({ userId })
    .populate('cards')
    .sort({ isActive: -1, updatedAt: -1 })
    .lean();

  return apiOk(decks);
}

// ─── POST /api/decks — Create a new deck ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  const userId = (session.user as any).id;
  const body = await req.json();
  const { name, cards } = body as { name?: string; cards?: string[] };

  if (!name || !name.trim()) return apiError('Deck name is required');
  if (name.trim().length > 40)
    return apiError('Deck name is too long (max 40 chars)');

  // Validate cards array
  if (!cards || !Array.isArray(cards))
    return apiError('Cards array is required');
  if (cards.length !== DECK_SIZE) {
    return apiError(`A deck must have exactly ${DECK_SIZE} cards`);
  }

  // Verify the user owns all these cards with sufficient quantities
  const cardIdCounts = new Map<string, number>();
  for (const id of cards) {
    cardIdCounts.set(id, (cardIdCounts.get(id) || 0) + 1);
  }

  const owned = await CollectionModel.find({ userId }).lean();
  const ownedMap = new Map(owned.map(e => [e.cardId.toString(), e.quantity]));

  for (const [cardId, needed] of cardIdCounts) {
    const have = ownedMap.get(cardId) ?? 0;
    if (have < needed) {
      return apiError(`You don't own enough copies of card ${cardId}`);
    }
  }

  // Limit: max 10 decks per user
  const deckCount = await DeckModel.countDocuments({ userId });
  if (deckCount >= 10) return apiError('Maximum 10 decks allowed');

  const isFirst = deckCount === 0;
  const deck = await DeckModel.create({
    userId,
    name: name.trim(),
    cards,
    isActive: isFirst, // first deck is auto-active
  });

  const populated = await DeckModel.findById(deck._id).populate('cards').lean();
  return apiOk(populated, 201);
}
