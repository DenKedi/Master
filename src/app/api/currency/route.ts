import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserModel from '@/models/User';
import TransactionModel from '@/models/Transaction';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';

// GET /api/currency — Get current user's currency + history
export async function GET() {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  const userId = (session.user as any).id;

  const user = await UserModel.findById(userId, 'currency').lean();
  const history = await TransactionModel.find({ userId })
    .lean()
    .sort({ createdAt: -1 })
    .limit(50);

  return apiOk({ balance: user?.currency ?? 0, history });
}

// POST /api/currency — Admin: grant or deduct currency for a user
export async function POST(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }

  const { targetUserId, amount, description } = await req.json();
  if (!targetUserId || amount === undefined) {
    return apiError('targetUserId and amount are required');
  }

  const user = await UserModel.findById(targetUserId);
  if (!user) return apiError('User not found', 404);

  user.currency = Math.max(0, user.currency + amount);
  await user.save();

  await TransactionModel.create({
    userId: targetUserId,
    type: amount >= 0 ? 'currency_grant' : 'currency_spend',
    amount,
    description:
      description ??
      (amount >= 0 ? 'Admin currency grant' : 'Admin currency deduction'),
  });

  return apiOk({ newBalance: user.currency });
}
