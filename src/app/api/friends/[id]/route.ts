import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserModel from '@/models/User';
import FriendRequestModel from '@/models/FriendRequest';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/friends/[id] — Accept or reject a friend request
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  const userId = (session.user as any).id;
  const { action } = await req.json(); // "accept" | "reject"

  if (!['accept', 'reject'].includes(action)) return apiError('Invalid action');

  const request = await FriendRequestModel.findById(id);
  if (!request) return apiError('Request not found', 404);
  if (request.toUserId.toString() !== userId) return apiError('Forbidden', 403);
  if (request.status !== 'pending') return apiError('Request already resolved');

  if (action === 'accept') {
    request.status = 'accepted';
    await request.save();

    // Mutually add as friends
    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { friends: request.fromUserId },
    });
    await UserModel.findByIdAndUpdate(request.fromUserId, {
      $addToSet: { friends: userId },
    });
  } else {
    request.status = 'rejected';
    await request.save();
  }

  return apiOk({ status: request.status });
}

// DELETE /api/friends/[id] — Remove a friend (unfriend)
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params; // id = friend's user ID
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  const userId = (session.user as any).id;

  if (!mongoose.Types.ObjectId.isValid(id)) return apiError('Invalid ID');
  await UserModel.findByIdAndUpdate(userId, { $pull: { friends: id } });
  await UserModel.findByIdAndUpdate(id, { $pull: { friends: userId } });

  // Clean up the accepted request document too
  await FriendRequestModel.deleteOne({
    status: 'accepted',
    $or: [
      { fromUserId: userId, toUserId: id },
      { fromUserId: id, toUserId: userId },
    ],
  });

  return apiOk({ message: 'Friend removed' });
}
