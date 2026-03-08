/* ═══════════════════════════════════════════════════════════════════════════
 *  Legacy Base Set — Combo Recipes
 *  Maps Character + Arsenal → Combo Result card.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { BattleComboRecipe } from '../../../battle/types';
import {
  ArmedSquire,
  FortifiedKnight,
  HexBladeWitch,
  ShieldedSquire,
  GreatswordKnight,
  WardedWitch,
  ArmedGoblin,
  RagingOrc,
} from './combos';

export const legacyBaseRecipes: BattleComboRecipe[] = [
  {
    characterName: 'Bumbling Squire',
    arsenalName: 'Chipped Broadsword',
    result: ArmedSquire.toBattleCard('recipe-armed-squire'),
  },
  {
    characterName: 'Rusty Knight',
    arsenalName: 'Dented Buckler',
    result: FortifiedKnight.toBattleCard('recipe-fort-knight'),
  },
  {
    characterName: 'Swamp Witch',
    arsenalName: 'Chipped Broadsword',
    result: HexBladeWitch.toBattleCard('recipe-hex-blade'),
  },
  {
    characterName: 'Bumbling Squire',
    arsenalName: 'Dented Buckler',
    result: ShieldedSquire.toBattleCard('recipe-shield-squire'),
  },
  {
    characterName: 'Rusty Knight',
    arsenalName: 'Chipped Broadsword',
    result: GreatswordKnight.toBattleCard('recipe-armed-knight'),
  },
  {
    characterName: 'Swamp Witch',
    arsenalName: 'Dented Buckler',
    result: WardedWitch.toBattleCard('recipe-hex-shield'),
  },
  {
    characterName: 'Snotty Goblin',
    arsenalName: 'Gnarly Club',
    result: ArmedGoblin.toBattleCard('recipe-armed-goblin'),
  },
  {
    characterName: 'Confused Orc',
    arsenalName: 'Gnarly Club',
    result: RagingOrc.toBattleCard('recipe-raging-orc'),
  },
];
