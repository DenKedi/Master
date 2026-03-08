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

// GET /api/shop — List active shop packs
export async function GET() {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);
  const packs = await PackModel.find({ isActive: true })
    .lean()
    .sort({ type: 1, price: 1 });
  return apiOk(packs);
}
