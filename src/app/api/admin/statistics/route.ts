import connectDB from '@/lib/mongodb';
import UserModel from '@/models/User';
import CardModel from '@/models/Card';
import PackModel from '@/models/Pack';
import TransactionModel from '@/models/Transaction';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';
import { AdminStats } from '@/types';

// GET /api/admin/statistics
export async function GET() {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }

  const now = new Date();
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    totalCards,
    totalPacks,
    totalTransactions,
    newUsersLast7Days,
    newUsersLast30Days,
  ] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ isActive: true }),
    CardModel.countDocuments({ isActive: true }),
    PackModel.countDocuments({ isActive: true }),
    TransactionModel.countDocuments(),
    UserModel.countDocuments({ createdAt: { $gte: last7 } }),
    UserModel.countDocuments({ createdAt: { $gte: last30 } }),
  ]);

  // Currency in circulation
  const currencyAgg = await UserModel.aggregate([
    { $group: { _id: null, total: { $sum: '$currency' } } },
  ]);
  const totalCurrencyInCirculation = currencyAgg[0]?.total ?? 0;

  // Pack purchases
  const packsPurchasedLast7Days = await TransactionModel.countDocuments({
    type: 'pack_purchase',
    createdAt: { $gte: last7 },
  });
  const packsPurchasedLast30Days = await TransactionModel.countDocuments({
    type: 'pack_purchase',
    createdAt: { $gte: last30 },
  });

  // Top spenders (most negative transaction amounts)
  const topSpendersAgg = await TransactionModel.aggregate([
    { $match: { type: 'pack_purchase' } },
    { $group: { _id: '$userId', spent: { $sum: { $abs: '$amount' } } } },
    { $sort: { spent: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        username: '$user.username',
        spent: 1,
        _id: 0,
      },
    },
  ]);

  // Card rarity distribution
  const rarityAgg = await CardModel.aggregate([
    { $group: { _id: '$rarity', count: { $sum: 1 } } },
  ]);
  const cardRarityDistribution = Object.fromEntries(
    rarityAgg.map(r => [r._id, r.count]),
  ) as AdminStats['cardRarityDistribution'];

  // Daily active users (last 7 days, approximated by new transactions)
  const dailyUsersAgg = await TransactionModel.aggregate([
    { $match: { createdAt: { $gte: last7 } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $addToSet: '$userId' },
      },
    },
    { $project: { date: '$_id', count: { $size: '$count' }, _id: 0 } },
    { $sort: { date: 1 } },
  ]);

  // Revenue by day (pack purchases, last 30 days)
  const revenueByDayAgg = await TransactionModel.aggregate([
    { $match: { type: 'pack_purchase', createdAt: { $gte: last30 } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        amount: { $sum: { $abs: '$amount' } },
      },
    },
    { $project: { date: '$_id', amount: 1, _id: 0 } },
    { $sort: { date: 1 } },
  ]);

  const stats: AdminStats = {
    totalUsers,
    activeUsers,
    totalCards,
    totalPacks,
    totalTransactions,
    totalCurrencyInCirculation,
    newUsersLast7Days,
    newUsersLast30Days,
    packsPurchasedLast7Days,
    packsPurchasedLast30Days,
    topSpenders: topSpendersAgg,
    cardRarityDistribution,
    dailyActiveUsers: dailyUsersAgg,
    revenueByDay: revenueByDayAgg,
  };

  return apiOk(stats);
}
