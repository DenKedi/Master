import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import PackModel from '@/models/Pack';
import { apiOk, apiError } from '@/lib/utils';
import { auth } from '@/lib/nextauth';

// GET /api/admin/store — List all packs (including inactive)
export async function GET() {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }
  const packs = await PackModel.find().lean().sort({ createdAt: -1 });
  return apiOk(packs);
}

// POST /api/admin/store — Create a pack
export async function POST(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }

  const body = await req.json();
  const {
    name,
    description,
    price,
    cardCount,
    guaranteedRarity,
    imageUrl,
    type,
    discount,
    expiresAt,
    bundleItems,
    isFeatured,
  } = body;

  if (!name || !description || price === undefined || !cardCount || !imageUrl) {
    return apiError(
      'Missing required fields: name, description, price, cardCount, imageUrl',
    );
  }
  const pack = await PackModel.create({
    name,
    description,
    price,
    cardCount,
    guaranteedRarity,
    imageUrl,
    type: type ?? 'standard',
    isFeatured: isFeatured ?? false,
    discount,
    expiresAt,
    bundleItems,
  });

  return apiOk(pack, 201);
}

// PATCH /api/admin/store — Update a pack
export async function PATCH(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }

  const body = await req.json();
  const { packId, ...updates } = body;
  if (!packId) return apiError('packId is required');
  const pack = await PackModel.findByIdAndUpdate(
    packId,
    { $set: updates },
    { new: true, runValidators: true },
  ).lean();

  if (!pack) return apiError('Pack not found', 404);
  return apiOk(pack);
}

// DELETE /api/admin/store — Deactivate a pack
export async function DELETE(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }

  const { packId } = await req.json();
  if (!packId) return apiError('packId is required');
  const pack = await PackModel.findByIdAndUpdate(
    packId,
    { isActive: false },
    { returnDocument: 'after' },
  ).lean();
  if (!pack) return apiError('Pack not found', 404);
  return apiOk({ message: 'Pack deactivated' });
}
