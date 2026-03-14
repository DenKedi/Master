import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import CollectionModel from '@/models/Collection';
import UserModel from '@/models/User';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';

type RouteParams = { params: Promise<{ id: string }> };

// DELETE /api/admin/users/[id]/collection — Admin only; wipes all cards from a user's collection
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const [session] = await Promise.all([auth(), connectDB()]);
  const sessionUser = session?.user as any;
  if (!session || sessionUser.role !== 'admin')
    return apiError('Unauthorized', 401);

  const user = await UserModel.findById(id).lean();
  if (!user) return apiError('User not found', 404);

  const result = await CollectionModel.deleteMany({ userId: id });

  return apiOk({ message: 'Collection reset', deletedCount: result.deletedCount });
}
