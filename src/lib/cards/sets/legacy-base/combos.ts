/* ═══════════════════════════════════════════════════════════════════════════
 *  Legacy Base Set — Combo Results
 *  Cards produced when a character combines with an arsenal.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { ComboResultCard } from '../../base';

const SET = 'legacy-base';

// ── Player combos ───────────────────────────────────────────────────────

export const ArmedSquire = new ComboResultCard({
  name: 'Armed Squire',
  description: 'Still trips, but now he trips INTO enemies. With a sword.',
  rarity: 'nice',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/armed-squire.webp',
  attack: 9,
  defense: 5,
  cost: 0,
  characterType: 'human',
  comboSource: {
    characterName: 'Bumbling Squire',
    arsenalName: 'Chipped Broadsword',
  },
  set: SET,
});

export const FortifiedKnight = new ComboResultCard({
  name: 'Fortified Knight',
  description: 'A walking fortress that squeaks with every step.',
  rarity: 'nice',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/fortified-knight.webp',
  attack: 7,
  defense: 9,
  cost: 0,
  characterType: 'human',
  comboSource: { characterName: 'Rusty Knight', arsenalName: 'Dented Buckler' },
  set: SET,
});

export const HexBladeWitch = new ComboResultCard({
  name: 'Hex Blade Witch',
  description: 'A sword enchanted with swamp magic. Extra slimy.',
  rarity: 'special',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/hex-blade.webp',
  attack: 11,
  defense: 3,
  cost: 0,
  characterType: 'human',
  comboSource: {
    characterName: 'Swamp Witch',
    arsenalName: 'Chipped Broadsword',
  },
  effects: [
    {
      id: 'hex-combo-bonus',
      trigger: 'on-combo',
      description: 'Combo: deal 2 bonus damage.',
      handler: 'combo_bonus_attack',
      params: { amount: 2 },
    },
  ],
  set: SET,
});

export const ShieldedSquire = new ComboResultCard({
  name: 'Shielded Squire',
  description:
    'Hides behind a shield bigger than himself. Surprisingly effective.',
  rarity: 'nice',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/shielded-squire.webp',
  attack: 6,
  defense: 8,
  cost: 0,
  characterType: 'human',
  comboSource: {
    characterName: 'Bumbling Squire',
    arsenalName: 'Dented Buckler',
  },
  set: SET,
});

export const GreatswordKnight = new ComboResultCard({
  name: 'Greatsword Knight',
  description: 'Dual-wielding rust and determination. Loud and lethal.',
  rarity: 'nice',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/armed-knight.webp',
  attack: 10,
  defense: 5,
  cost: 0,
  characterType: 'human',
  comboSource: {
    characterName: 'Rusty Knight',
    arsenalName: 'Chipped Broadsword',
  },
  set: SET,
});

export const WardedWitch = new ComboResultCard({
  name: 'Warded Witch',
  description:
    'A magical barrier of swamp gas. Smells terrible, deflects everything.',
  rarity: 'special',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/warded-witch.webp',
  attack: 8,
  defense: 6,
  cost: 0,
  characterType: 'human',
  comboSource: { characterName: 'Swamp Witch', arsenalName: 'Dented Buckler' },
  effects: [
    {
      id: 'ward-combo-heal',
      trigger: 'on-combo',
      description: 'Combo: restore 2 HP.',
      handler: 'heal_owner',
      params: { amount: 2 },
    },
  ],
  set: SET,
});

// ── Opponent combos ─────────────────────────────────────────────────────

export const ArmedGoblin = new ComboResultCard({
  name: 'Armed Goblin',
  description: 'Still disgusting, but now armed and dangerous.',
  rarity: 'nice',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/armed-goblin.webp',
  attack: 6,
  defense: 3,
  cost: 0,
  characterType: 'goblin',
  comboSource: { characterName: 'Snotty Goblin', arsenalName: 'Gnarly Club' },
  set: SET,
});

export const RagingOrc = new ComboResultCard({
  name: 'Raging Orc',
  description: 'Finally figured out why he is here. Now everyone pays.',
  rarity: 'nice',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/raging-orc.webp',
  attack: 7,
  defense: 4,
  cost: 0,
  characterType: 'beast',
  comboSource: { characterName: 'Confused Orc', arsenalName: 'Gnarly Club' },
  set: SET,
});

export const allCombos = [
  ArmedSquire,
  FortifiedKnight,
  HexBladeWitch,
  ShieldedSquire,
  GreatswordKnight,
  WardedWitch,
  ArmedGoblin,
  RagingOrc,
];
