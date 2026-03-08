import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserModel from '@/models/User';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id] — Get user profile
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  if (!mongoose.Types.ObjectId.isValid(id)) return apiError('Invalid ID');
  const user = await UserModel.findById(id, '-passwordHash').lean();
  if (!user) return apiError('User not found', 404);

  return apiOk(user);
}

// PATCH /api/users/[id] — Update profile (self or admin)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) return apiError('Unauthorized', 401);

  const sessionUser = session.user as any;
  if (sessionUser.id !== id && sessionUser.role !== 'admin') {
    return apiError('Forbidden', 403);
  }

  const body = await req.json();
  const allowedFields: Record<string, unknown> = {};
  if (body.avatarUrl !== undefined) allowedFields.avatarUrl = body.avatarUrl;
  if (body.username !== undefined) allowedFields.username = body.username;
  if (sessionUser.role === 'admin') {
    if (body.isActive !== undefined) allowedFields.isActive = body.isActive;
    if (body.role !== undefined) allowedFields.role = body.role;
  }
  const user = await UserModel.findByIdAndUpdate(
    id,
    { $set: allowedFields },
    { new: true, runValidators: true, projection: '-passwordHash' },
  ).lean();

  if (!user) return apiError('User not found', 404);
  return apiOk(user);
}

// DELETE /api/users/[id] — Admin only
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const [session] = await Promise.all([auth(), connectDB()]);
  const sessionUser = session?.user as any;
  if (!session || sessionUser.role !== 'admin')
    return apiError('Unauthorized', 401);
  const user = await UserModel.findByIdAndUpdate(id, {
    isActive: false,
  }).lean();
  if (!user) return apiError('User not found', 404);

  return apiOk({ message: 'User deactivated' });
}
