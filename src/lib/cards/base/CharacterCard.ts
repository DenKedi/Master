/* ═══════════════════════════════════════════════════════════════════════════
 *  CharacterCard — A playable fighter with an optional species subtype.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { Card, type CardConfig, type CardDocumentShape } from './Card';
import type { BattleCard } from '../../battle/types';
import type { CharacterType } from '@/types';

export interface CharacterCardConfig extends Omit<CardConfig, 'type'> {
  characterType?: CharacterType;
}

export interface CharacterDocumentShape extends CardDocumentShape {
  characterType?: CharacterType;
}

export class CharacterCard extends Card {
  readonly characterType?: CharacterType;

  constructor(config: CharacterCardConfig) {
    super({ ...config, type: 'character' });
    this.characterType = config.characterType;
  }

  override toBattleCard(uid: string): BattleCard {
    return {
      ...super.toBattleCard(uid),
      characterType: this.characterType,
    };
  }

  override toDocument(): CharacterDocumentShape {
    return {
      ...super.toDocument(),
      characterType: this.characterType,
    };
  }
}
