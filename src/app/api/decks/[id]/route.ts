import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import DeckModel from '@/models/Deck';
import CollectionModel from '@/models/Collection';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';
import { DECK_SIZE } from '@/lib/battle/constants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── GET /api/decks/[id] — Get a single deck ────────────────────────────────
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  const { id } = await params;
  const userId = (session.user as any).id;

  const deck = await DeckModel.findOne({ _id: id, userId })
    .populate('cards')
    .lean();
  if (!deck) return apiError('Deck not found', 404);

  return apiOk(deck);
}

// ─── PUT /api/decks/[id] — Update a deck ────────────────────────────────────
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  const { id } = await params;
  const userId = (session.user as any).id;

  const deck = await DeckModel.findOne({ _id: id, userId });
  if (!deck) return apiError('Deck not found', 404);

  const body = await req.json();
  const { name, cards, isActive } = body as {
    name?: string;
    cards?: string[];
    isActive?: boolean;
  };

  // Update name
  if (name !== undefined) {
    if (!name.trim()) return apiError('Deck name is required');
    if (name.trim().length > 40)
      return apiError('Deck name is too long (max 40 chars)');
    deck.name = name.trim();
  }

  // Update cards
  if (cards !== undefined) {
    if (!Array.isArray(cards) || cards.length !== DECK_SIZE) {
      return apiError(`A deck must have exactly ${DECK_SIZE} cards`);
    }

    // Verify ownership
    const cardIdCounts = new Map<string, number>();
    for (const cid of cards) {
      cardIdCounts.set(cid, (cardIdCounts.get(cid) || 0) + 1);
    }

    const owned = await CollectionModel.find({ userId }).lean();
    const ownedMap = new Map(owned.map(e => [e.cardId.toString(), e.quantity]));

    for (const [cardId, needed] of cardIdCounts) {
      const have = ownedMap.get(cardId) ?? 0;
      if (have < needed) {
        return apiError(`You don't own enough copies of card ${cardId}`);
      }
    }

    deck.cards = cards as any;
  }

  // Set as active deck (deactivate others)
  if (isActive === true) {
    await DeckModel.updateMany(
      { userId, _id: { $ne: id } },
      { isActive: false },
    );
    deck.isActive = true;
  } else if (isActive === false) {
    deck.isActive = false;
  }

  await deck.save();
  const populated = await DeckModel.findById(deck._id).populate('cards').lean();
  return apiOk(populated);
}

// ─── DELETE /api/decks/[id] — Delete a deck ─────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  const { id } = await params;
  const userId = (session.user as any).id;

  const deck = await DeckModel.findOneAndDelete({ _id: id, userId });
  if (!deck) return apiError('Deck not found', 404);

  // If the deleted deck was active, activate the most recent remaining deck
  if (deck.isActive) {
    const next = await DeckModel.findOne({ userId }).sort({ updatedAt: -1 });
    if (next) {
      next.isActive = true;
      await next.save();
    }
  }

  return apiOk({ deleted: true });
}
