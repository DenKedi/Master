import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { auth } from '@/lib/nextauth';
import { apiOk, apiError } from '@/lib/utils';
import { preRenderAllCards } from '@/lib/cards/render/prerender';
import { reloadLegacyBase } from '@/lib/cards/sets/legacy-base';
import { clearFontCache } from '@/lib/cards/render/renderCard';

// POST /api/admin/cards/render-all — pre-render every active card and upload to R2
export async function POST() {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }

  // Reset caches before bulk render
  reloadLegacyBase();
  clearFontCache();

  const result = await preRenderAllCards();

  return apiOk(result);
}
