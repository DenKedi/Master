/* ═══════════════════════════════════════════════════════════════════════════
 *  defineCard — Lightweight card definition helper.
 *
 *  Each card's .ts file calls defineCard() to declare its code-level data:
 *  type, characterType, imageUrl, effects, and optionally combo ingredients.
 *
 *  Presentation data (name, description, rarity, stats) lives in the DB
 *  and is managed via the admin panel.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { CardType, CharacterType } from '@/types';
import type { CardEffect } from '@/lib/battle/types';

/** Combo recipe attached to a combo-result card definition */
export interface CardComboRecipe {
  characterId: string;
  arsenalId: string;
  bonus: { attack: number; defense: number };
}

/** Code-level card definition (everything that lives in .ts files) */
export interface CardDefinition {
  /** Unique slug, e.g. 'goblin-bungler'. Primary key across code and DB. */
  id: string;
  /** Card type: character, arsenal, destination, trick */
  type: CardType;
  /** Species / subtype for character cards */
  characterType?: CharacterType;
  /** Default image path (can be overridden via admin/R2) */
  imageUrl?: string;
  /** Programmatic effects */
  effects: CardEffect[];
  /** For combo result cards: which ingredients produce this card */
  combo?: CardComboRecipe[];
}

/** Create a typed card definition. */
export function defineCard(def: CardDefinition): CardDefinition {
  return def;
}
