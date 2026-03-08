/* ═══════════════════════════════════════════════════════════════════════════
 *  ComboResultCard — A character produced by combining a character + arsenal.
 *  Records its combo source so the engine can match recipes.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { CharacterCard, type CharacterCardConfig } from './CharacterCard';
import type { BattleCard } from '../../battle/types';

export interface ComboResultCardConfig extends CharacterCardConfig {
  comboSource: { characterName: string; arsenalName: string };
}

export class ComboResultCard extends CharacterCard {
  readonly comboSource: { characterName: string; arsenalName: string };

  constructor(config: ComboResultCardConfig) {
    super(config);
    this.comboSource = config.comboSource;
  }

  override toBattleCard(uid: string): BattleCard {
    return {
      ...super.toBattleCard(uid),
      comboSource: this.comboSource,
    };
  }
}
