/* ═══════════════════════════════════════════════════════════════════════════
 *  seed-cards  — Push the card registry into MongoDB.
 *
 *  Run:  npx tsx src/scripts/seed-cards.ts
 *
 *  For each registered card definition, upserts by cardId.
 *  Code-managed fields (type, characterType, effects, default imageUrl)
 *  are always synced. Admin-managed fields (name, description, rarity,
 *  attack, defense) are only set on first insert.
 * ═══════════════════════════════════════════════════════════════════════════ */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local (Next.js convention) since dotenv isn't a dependency
function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local not found — rely on env vars
  }
}

loadEnvLocal();

// Import all sets — side-effect registers cards into the registry
import '@/lib/cards/sets/legacy-base';
import { registry } from '@/lib/cards/registry';
import CardModel from '@/models/Card';

/** Convert a card id slug to a human-readable name: 'goblin-bungler' → 'Goblin Bungler' */
function humanize(id: string): string {
  return id
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env.local');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Clean up deprecated cards that no longer exist in code
  const cardsToRemove = [
    'Trick: Pocket Aces',
    'Armed Goblin', 'Armed Squire', 'Armed Troll', 'Bone Hammer',
    'Bumbling Squire', 'Cave Bear', 'Confused Orc', 'Crumbling Courtyard',
    'Fortified Knight', 'Gnarly Club', 'Goblin Shaman', 'Goblin Warlord',
    'Hex Blade Witch', 'Ogre Warrior', 'Raging Orc', 'Rampaging Bear',
    'Rampaging Ogre', 'Rusty Knight', 'Shielded Squire', 'Snotty Goblin',
    'Swamp Witch', 'Troll Brute', 'Warded Shaman', 'Warded Witch',
    'Greatsword Knight', 'Poison Spider', 'Shaman Blade'
  ];
  const deleteResult = await CardModel.deleteMany({ name: { $in: cardsToRemove } });
  console.log(`Deleted ${deleteResult.deletedCount} deprecated cards (by name).`);

  const allDefs = registry.getAll();
  const allSets = registry.getAllSets();

  // Build a setId lookup: cardId → setId
  const cardSetMap = new Map<string, string>();
  for (const set of allSets) {
    for (const card of set.cards) {
      cardSetMap.set(card.id, set.id);
    }
  }

  console.log(`Syncing ${allDefs.length} card definitions from registry…`);

  let created = 0;
  let updated = 0;

  for (const def of allDefs) {
    const setId = cardSetMap.get(def.id);

    // Effect description for the legacy `effect` text field
    const effectDescription =
      def.effects.length > 0
        ? def.effects.map(e => e.description).filter(Boolean).join('; ')
        : undefined;

    // Code-managed fields — always synced
    const codeFields: Record<string, unknown> = {
      type: def.type,
      effects: def.effects,
      effect: effectDescription,
      ...(def.characterType !== undefined && { characterType: def.characterType }),
      ...(setId && { setId }),
    };

    // Default fields — only set on first insert
    const defaults: Record<string, unknown> = {
      name: humanize(def.id),
      description: '',
      rarity: 'normal',
      attack: 0,
      defense: 0,
      imageUrl: def.imageUrl,
      isActive: true,
      tags: [],
    };

    const existing = await CardModel.findOne({ cardId: def.id });

    if (existing) {
      // Update code-managed fields only; preserve admin-edited values
      // Also sync imageUrl if admin hasn't overridden it

      await CardModel.updateOne({ cardId: def.id }, { $set: codeFields });
      updated++;
    } else {
      // First insert — set all defaults + code fields
      await CardModel.create({
        cardId: def.id,
        ...defaults,
        ...codeFields,
      });
      created++;
    }
  }

  // Remove cards from DB whose cardId no longer exists in code
  const registeredIds = allDefs.map(d => d.id);
  const orphans = await CardModel.deleteMany({
    cardId: { $exists: true, $nin: registeredIds },
  });
  if (orphans.deletedCount > 0) {
    console.log(`Removed ${orphans.deletedCount} orphaned cards (cardId no longer in code).`);
  }

  console.log(`Done — ${created} created, ${updated} updated.`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
