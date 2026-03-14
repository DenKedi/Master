/* ═══════════════════════════════════════════════════════════════════════════
 *  Card Registry → MongoDB sync
 *
 *  Called on server startup to ensure every card defined in TypeScript has
 *  a corresponding document in MongoDB.
 *
 *  Rules:
 *  - Code-managed fields (type, effects, characterType, setId) are always
 *    overwritten to match the TS definition.
 *  - Admin-managed fields (name, description, rarity, attack, defense,
 *    price, isFeatured, isActive, tags) are only written on first insert;
 *    subsequent syncs leave them untouched.
 *  - Cards whose cardId is no longer present in code are deactivated (not
 *    deleted) to preserve player collections.
 * ═══════════════════════════════════════════════════════════════════════════ */

// Side-effect: registers all cards into the registry
import './sets/legacy-base';

import { registry } from './registry';
import CardModel from '../../models/Card';

function humanize(id: string): string {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export interface SyncResult {
  created: number;
  updated: number;
  deactivated: number;
}

export async function syncCardsFromRegistry(): Promise<SyncResult> {
  const allDefs = registry.getAll();
  const allSets = registry.getAllSets();

  // Build cardId → setId lookup
  const cardSetMap = new Map<string, string>();
  for (const set of allSets) {
    for (const card of set.cards) {
      cardSetMap.set(card.id, set.id);
    }
  }

  let created = 0;
  let updated = 0;

  for (const def of allDefs) {
    const setId = cardSetMap.get(def.id);

    const effectDescription =
      def.effects.length > 0
        ? def.effects.map((e: { description?: string }) => e.description).filter(Boolean).join('; ')
        : undefined;

    // Fields that always reflect the code definition
    const codeFields: Record<string, unknown> = {
      type: def.type,
      effects: def.effects,
      effect: effectDescription,
      isActive: true,
      ...(def.characterType !== undefined && { characterType: def.characterType }),
      ...(setId && { setId }),
    };

    // Fields only written on the initial insert
    const defaults: Record<string, unknown> = {
      name: humanize(def.id),
      description: '',
      rarity: 'normal',
      attack: 0,
      defense: 0,
      imageUrl: def.imageUrl ?? '',
      tags: [],
      isFeatured: false,
    };

    const existing = await CardModel.findOne({ cardId: def.id });

    if (existing) {
      // imageUrl is fully managed via R2 admin uploads — never overwrite from code
      await CardModel.updateOne({ cardId: def.id }, { $set: codeFields });
      updated++;
    } else {
      await CardModel.create({
        cardId: def.id,
        ...defaults,
        ...codeFields,
      });
      created++;
    }
  }

  // Deactivate cards whose cardId no longer exists in code
  const registeredIds = allDefs.map((d: { id: string }) => d.id);
  const orphanResult = await CardModel.updateMany(
    { cardId: { $exists: true, $nin: registeredIds }, isActive: true },
    { $set: { isActive: false } },
  );
  const deactivated = orphanResult.modifiedCount;

  return { created, updated, deactivated };
}
