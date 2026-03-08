import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserModel from '@/models/User';
import FriendRequestModel from '@/models/FriendRequest';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';

// GET /api/friends — Get friend list and pending requests
export async function GET() {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  const userId = (session.user as any).id;

  const user = await UserModel.findById(userId, 'friends')
    .populate('friends', 'username avatarUrl isActive')
    .lean();

  const pending = await FriendRequestModel.find({
    toUserId: userId,
    status: 'pending',
  })
    .populate('fromUserId', 'username avatarUrl')
    .lean();

  const sent = await FriendRequestModel.find({
    fromUserId: userId,
    status: 'pending',
  })
    .populate('toUserId', 'username avatarUrl')
    .lean();

  return apiOk({ friends: user?.friends ?? [], pending, sent });
}

// POST /api/friends — Send a friend request
export async function POST(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  const fromUserId = (session.user as any).id;
  const { toUserId } = await req.json();

  if (!toUserId) return apiError('toUserId is required');
  if (fromUserId === toUserId) return apiError('Cannot friend yourself');

  const existing = await FriendRequestModel.findOne({ fromUserId, toUserId });
  if (existing) return apiError('Request already sent');

  const toUser = await UserModel.findById(toUserId);
  if (!toUser) return apiError('User not found', 404);

  const request = await FriendRequestModel.create({ fromUserId, toUserId });
  return apiOk(request, 201);
}
