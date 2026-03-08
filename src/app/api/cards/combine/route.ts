import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import CardRecipeModel from '@/models/CardRecipe';
import CollectionModel from '@/models/Collection';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';

// POST /api/cards/combine — Combine two base cards the player owns into an advanced card
export async function POST(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  const userId = (session.user as any).id;
  const { cardIdA, cardIdB } = await req.json();

  if (!cardIdA || !cardIdB) {
    return apiError('Two card IDs required');
  }
  if (cardIdA === cardIdB) {
    return apiError('Cannot combine a card with itself');
  }

  // Check the player owns both cards
  const [entryA, entryB] = await Promise.all([
    CollectionModel.findOne({ userId, cardId: cardIdA }),
    CollectionModel.findOne({ userId, cardId: cardIdB }),
  ]);
  if (!entryA || entryA.quantity < 1)
    return apiError('You do not own the first card');
  if (!entryB || entryB.quantity < 1)
    return apiError('You do not own the second card');

  // Look up recipe (order-independent)
  const recipe = await CardRecipeModel.findOne({
    $or: [
      { ingredientA: cardIdA, ingredientB: cardIdB },
      { ingredientA: cardIdB, ingredientB: cardIdA },
    ],
  }).populate('result');

  if (!recipe)
    return apiError('No valid combination found for these cards', 404);

  // Consume one of each ingredient
  entryA.quantity -= 1;
  entryB.quantity -= 1;
  await Promise.all([entryA.save(), entryB.save()]);

  // Grant the result card
  const existing = await CollectionModel.findOne({
    userId,
    cardId: recipe.result._id,
  });
  if (existing) {
    existing.quantity += 1;
    await existing.save();
  } else {
    await CollectionModel.create({
      userId,
      cardId: recipe.result._id,
      quantity: 1,
    });
  }

  return apiOk({
    message: 'Combination successful!',
    result: recipe.result,
    consumed: [cardIdA, cardIdB],
  });
}

// GET /api/cards/combine — List all known recipes (discovery / recipe book)
export async function GET() {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  const recipes = await CardRecipeModel.find()
    .populate('ingredientA', 'name imageUrl type tier rarity')
    .populate('ingredientB', 'name imageUrl type tier rarity')
    .populate('result', 'name imageUrl type tier rarity attack defense effect')
    .lean();

  return apiOk(recipes);
}
