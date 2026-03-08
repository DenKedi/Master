/* ═══════════════════════════════════════════════════════════════════════════
 *  seed-cards  — Push the card registry into MongoDB.
 *
 *  Run:  npx tsx src/scripts/seed-cards.ts
 *
 *  For each registered card, upserts by name so existing cards are updated
 *  and new ones are inserted.
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

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env.local');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const cards = registry.getAll();
  console.log(`Syncing ${cards.length} cards from registry…`);

  let created = 0;
  let updated = 0;

  for (const card of cards) {
    const doc = card.toDocument();
    const result = await CardModel.findOneAndUpdate(
      { name: doc.name },
      { $set: doc },
      { upsert: true, new: true },
    );
    if (result.createdAt?.getTime() === result.updatedAt?.getTime()) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(`Done — ${created} created, ${updated} updated.`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
