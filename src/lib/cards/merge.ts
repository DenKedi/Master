/* ═══════════════════════════════════════════════════════════════════════════
 *  merge — Combines a code-level CardDefinition with DB card data
 *  to produce a BattleCard for the engine.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { CardDefinition } from './define';
import type { BattleCard, BattleCardType } from '../battle/types';

/** DB card shape (subset of fields needed for merge) */
export interface CardDbData {
  name: string;
  description: string;
  rarity: string;
  attack: number;
  defense: number;
  imageUrl: string;
}

/**
 * Merge a code definition + DB metadata into a BattleCard.
 * Effects come from code; stats/presentation from DB.
 */
export function mergeToBattleCard(
  def: CardDefinition,
  db: CardDbData,
  uid: string,
): BattleCard {
  return {
    uid,
    cardId: def.id,
    name: db.name,
    description: db.description,
    type: def.type as BattleCardType,
    imageUrl: db.imageUrl,
    attack: db.attack,
    defense: db.defense,
    effects: def.effects,
    rarity: db.rarity,
    characterType: def.characterType,
  };
}
