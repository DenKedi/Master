/* ═══════════════════════════════════════════════════════════════════════════
 *  defineSet — Declares a card set with pullRates and its cards.
 *
 *  Each set folder exports a single SetDefinition via defineSet().
 *  The registry stores sets for pullRate look-ups at pack-purchase time.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { CardDefinition } from './define';

/** Per-rarity weights used when rolling cards from this set's packs. */
export interface RarityWeights {
  normal: number;
  nice: number;
  special: number;
  uiiiii: number;
  unknown: number;
}

/** A complete set definition. */
export interface SetDefinition {
  /** Unique set slug, e.g. 'legacy-base' */
  id: string;
  /** Rarity pull-rate weights for packs based on this set */
  pullRates: RarityWeights;
  /** All card definitions belonging to this set */
  cards: CardDefinition[];
}

/** Create a typed set definition. */
export function defineSet(set: SetDefinition): SetDefinition {
  return set;
}
