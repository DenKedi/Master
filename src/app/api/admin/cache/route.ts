import { auth } from '@/lib/nextauth';
import { apiOk, apiError } from '@/lib/utils';
import { registry } from '@/lib/cards/registry';
import { reloadLegacyBase } from '@/lib/cards/sets/legacy-base';
import { clearFontCache } from '@/lib/cards/render/renderCard';

// POST /api/admin/cache — clear all server caches and reload registries
export async function POST() {
  const session = await auth();
  if (!session || (session.user as any).role !== 'admin') {
    return apiError('Unauthorized', 401);
  }

  const before = registry.size;

  // Clear & reload card registry
  reloadLegacyBase();

  // Clear font cache so fonts reload on next render
  clearFontCache();

  return apiOk({
    message: 'All caches cleared and registries reloaded.',
    cardsBefore: before,
    cardsAfter: registry.size,
  });
}
