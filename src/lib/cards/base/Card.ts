/* ═══════════════════════════════════════════════════════════════════════════
 *  Card Base Class
 *  Abstract foundation for every card in the game. Subclasses define the
 *  specific card type (Character, Arsenal, Destination, Trick).
 *
 *  Each concrete card file calls the constructor with its stats + effects,
 *  then the engine uses  toBattleCard()  to get the battle-ready shape and
 *  toDocument()  to get the MongoDB-ready shape.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type {
  CardEffect,
  BattleCard,
  BattleCardType,
} from '../../battle/types';
import type { CardRarity, CardTier, CardType } from '@/types';

export interface CardConfig {
  name: string;
  description: string;
  type: CardType;
  rarity: CardRarity;
  tier: CardTier;
  imageUrl: string;
  attack: number;
  defense: number;
  cost: number;
  tags?: string[];
  effects?: CardEffect[];
  set: string; // e.g. 'legacy-base'
  isActive?: boolean;
}

export interface CardDocumentShape {
  name: string;
  description: string;
  rarity: CardRarity;
  type: CardType;
  tier: CardTier;
  imageUrl: string;
  attack: number;
  defense: number;
  effect?: string;
  effects: CardEffect[];
  cost: number;
  tags: string[];
  isActive: boolean;
}

export abstract class Card {
  readonly name: string;
  readonly description: string;
  readonly type: CardType;
  readonly rarity: CardRarity;
  readonly tier: CardTier;
  readonly imageUrl: string;
  readonly attack: number;
  readonly defense: number;
  readonly cost: number;
  readonly tags: string[];
  readonly effects: CardEffect[];
  readonly set: string;
  readonly isActive: boolean;

  constructor(config: CardConfig) {
    this.name = config.name;
    this.description = config.description;
    this.type = config.type;
    this.rarity = config.rarity;
    this.tier = config.tier;
    this.imageUrl = config.imageUrl;
    this.attack = config.attack;
    this.defense = config.defense;
    this.cost = config.cost;
    this.tags = config.tags ?? [];
    this.effects = config.effects ?? [];
    this.set = config.set;
    this.isActive = config.isActive ?? true;
  }

  /** Build a BattleCard for the engine. Caller supplies a unique instance id. */
  toBattleCard(uid: string): BattleCard {
    return {
      uid,
      name: this.name,
      description: this.description,
      type: this.type as BattleCardType,
      imageUrl: this.imageUrl,
      attack: this.attack,
      defense: this.defense,
      effects: this.effects,
      rarity: this.rarity,
    };
  }

  /** Build a plain object suitable for MongoDB upsert via CardModel. */
  toDocument(): CardDocumentShape {
    const effectDescription =
      this.effects.length > 0
        ? this.effects.map(e => e.description).join('; ')
        : undefined;

    return {
      name: this.name,
      description: this.description,
      rarity: this.rarity,
      type: this.type,
      tier: this.tier,
      imageUrl: this.imageUrl,
      attack: this.attack,
      defense: this.defense,
      effect: effectDescription,
      effects: this.effects,
      cost: this.cost,
      tags: this.tags,
      isActive: this.isActive,
    };
  }
}
