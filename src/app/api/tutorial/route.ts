import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserModel from '@/models/User';
import CardModel from '@/models/Card';
import CollectionModel from '@/models/Collection';
import DeckModel from '@/models/Deck';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';
import { TOTAL_TUTORIAL_STEPS, STARTER_DECK_CARDS } from '@/lib/battle/tutorial';

// GET /api/tutorial — Get current user's tutorial progress
export async function GET() {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session?.user) return apiError('Unauthorized', 401);
  const userId = (session.user as any).id;

  const user = await UserModel.findById(userId).select(
    'tutorialCompleted tutorialStep',
  );
  if (!user) return apiError('User not found', 404);

  return apiOk({
    tutorialCompleted: user.tutorialCompleted,
    tutorialStep: user.tutorialStep,
    totalSteps: TOTAL_TUTORIAL_STEPS,
  });
}

// PATCH /api/tutorial — Update tutorial progress
export async function PATCH(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session?.user) return apiError('Unauthorized', 401);
  const userId = (session.user as any).id;

  const body = await req.json();
  const { tutorialStep, tutorialCompleted } = body;

  const update: Record<string, unknown> = {};

  if (typeof tutorialStep === 'number' && tutorialStep >= 0) {
    update.tutorialStep = Math.min(tutorialStep, TOTAL_TUTORIAL_STEPS);
  }

  if (typeof tutorialCompleted === 'boolean') {
    update.tutorialCompleted = tutorialCompleted;
  }

  if (Object.keys(update).length === 0) {
    return apiError('No valid fields to update');
  }

  const userBefore = await UserModel.findById(userId).select('tutorialCompleted');
  const alreadyCompleted = userBefore?.tutorialCompleted === true;

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: update },
    { returnDocument: 'after' },
  ).select('tutorialCompleted tutorialStep');

  if (!user) return apiError('User not found', 404);

  // ── Grant starter deck + cards on first tutorial completion ──
  let starterDeckGranted = false;
  let grantedCards: Record<string, unknown>[] = [];

  if (tutorialCompleted === true && !alreadyCompleted) {
    // Check if starter deck was already given (idempotent)
    const existing = await DeckModel.findOne({ userId, name: 'First Steps' });
    if (!existing) {
      // Look up all starter card DB documents by cardId
      const cardIds = STARTER_DECK_CARDS.map(c => c.cardId);
      const cards = await CardModel.find({ cardId: { $in: cardIds }, isActive: true }).lean();
      const cardMap = new Map(cards.map(c => [c.cardId, c]));

      // Build deck card ID list and collection quantities
      const deckCardIds: string[] = [];
      const collectionOps = [];

      for (const entry of STARTER_DECK_CARDS) {
        const card = cardMap.get(entry.cardId);
        if (!card) continue;
        const cardId = card._id.toString();

        // Add N copies to the deck
        for (let i = 0; i < entry.quantity; i++) {
          deckCardIds.push(cardId);
        }

        // Upsert collection: give at least entry.quantity copies
        collectionOps.push(
          CollectionModel.findOneAndUpdate(
            { userId, cardId: card._id },
            { $max: { quantity: entry.quantity }, $setOnInsert: { obtainedAt: new Date() } },
            { upsert: true },
          ),
        );
      }

      // Grant cards to collection
      await Promise.all(collectionOps);

      // Create the "First Steps" deck
      if (deckCardIds.length > 0) {
        const hasActiveDeck = await DeckModel.exists({ userId, isActive: true });
        await DeckModel.create({
          userId,
          name: 'First Steps',
          cards: deckCardIds,
          isActive: !hasActiveDeck,
        });
        starterDeckGranted = true;
      }

      // Build grantedCards array for the reveal overlay
      grantedCards = STARTER_DECK_CARDS
        .map(entry => {
          const card = cardMap.get(entry.cardId);
          if (!card) return null;
          return {
            name: card.name,
            rarity: card.rarity,
            type: card.type,
            attack: card.attack,
            defense: card.defense,
            characterType: card.characterType,
            quantity: entry.quantity,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);
    }
  }

  return apiOk({
    tutorialCompleted: user.tutorialCompleted,
    tutorialStep: user.tutorialStep,
    totalSteps: TOTAL_TUTORIAL_STEPS,
    starterDeckGranted,
    grantedCards,
  });
}
