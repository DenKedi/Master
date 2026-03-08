import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import PackModel from '@/models/Pack';
import UserModel from '@/models/User';
import CardModel from '@/models/Card';
import CollectionModel from '@/models/Collection';
import TransactionModel from '@/models/Transaction';
import {
  apiOk,
  apiError,
  applyDiscount,
  pickRandomRarity,
  DEFAULT_RARITY_WEIGHTS,
} from '@/lib/utils';
import { auth } from '@/lib/nextauth';

// POST /api/shop/packs — Purchase a pack
export async function POST(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  const userId = (session.user as any).id;
  const { packId } = await req.json();
  if (!packId) return apiError('packId is required');

  const pack = await PackModel.findById(packId);
  if (!pack || !pack.isActive) return apiError('Pack not available', 404);

  const finalPrice = applyDiscount(pack.price, pack.discount);

  const user = await UserModel.findById(userId);
  if (!user) return apiError('User not found', 404);

  if (user.currency < finalPrice) {
    return apiError(
      `Not enough currency. Need ${finalPrice}, have ${user.currency}`,
    );
  }

  // Deduct currency
  user.currency -= finalPrice;
  await user.save();

  // Record transaction
  await TransactionModel.create({
    userId,
    type: 'pack_purchase',
    amount: -finalPrice,
    description: `Purchased pack: ${pack.name}`,
    metadata: { packId: pack._id, packName: pack.name },
  });

  // Roll cards
  const drawnCards = [];
  for (let i = 0; i < pack.cardCount; i++) {
    // Use guaranteed rarity for last card if set
    const rarityWeights =
      i === pack.cardCount - 1 && pack.guaranteedRarity
        ? { [pack.guaranteedRarity]: 100 }
        : DEFAULT_RARITY_WEIGHTS;

    const rarity = pickRandomRarity(rarityWeights);

    const card = await CardModel.aggregate([
      { $match: { rarity, isActive: true } },
      { $sample: { size: 1 } },
    ]).then(res => res[0]);

    if (card) {
      await CollectionModel.findOneAndUpdate(
        { userId, cardId: card._id },
        { $inc: { quantity: 1 }, $setOnInsert: { obtainedAt: new Date() } },
        { upsert: true, new: true },
      );
      drawnCards.push(card);
    }
  }

  return apiOk({
    drawnCards,
    remainingCurrency: user.currency,
    packName: pack.name,
  });
}
