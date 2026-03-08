import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserModel from '@/models/User';
import TransactionModel from '@/models/Transaction';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';
import { getRank, getRankProgress } from '@/lib/ranks';

export type XpSource =
  | 'tutorial'
  | 'battle_win'
  | 'battle_loss'
  | 'combine'
  | 'pack_open'
  | 'daily_login'
  | 'friend';

// POST /api/xp — Grant XP to the current user
export async function POST(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session?.user) return apiError('Unauthorized', 401);
  const userId = (session.user as any).id;

  const body = await req.json();
  const { source, amount } = body as { source?: XpSource; amount?: number };

  if (!source || typeof amount !== 'number' || amount <= 0) {
    return apiError(
      'source (string) and amount (positive number) are required',
    );
  }

  // Prevent duplicate tutorial XP grant
  if (source === 'tutorial') {
    const user = await UserModel.findById(userId).select('tutorialCompleted');
    if (user?.tutorialCompleted) {
      // Check if XP was already granted for tutorial
      const existing = await TransactionModel.findOne({
        userId,
        type: 'xp_grant',
        'metadata.source': 'tutorial',
      });
      if (existing) {
        return apiError('Tutorial XP already granted', 409);
      }
    }
  }

  // Update user XP
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $inc: { xp: amount } },
    { returnDocument: 'after' },
  ).select('xp');

  if (!user) return apiError('User not found', 404);

  // Log transaction
  await TransactionModel.create({
    userId,
    type: 'xp_grant',
    amount,
    description: `XP granted: ${amount} from ${source}`,
    metadata: { source, xpAmount: amount },
  });

  const rank = getRank(user.xp);
  const progress = getRankProgress(user.xp);

  return apiOk({
    xp: user.xp,
    xpGranted: amount,
    rank: rank.title,
    rankProgress: progress.pct,
    nextRank: progress.next?.title ?? null,
  });
}
