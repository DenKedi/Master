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

// ── Player goblin combos ────────────────────────────────────────────────

export const SwordsmanGoblin = new ComboResultCard({
  name: 'Swordsman Goblin',
  description: 'A brawler with a blade. Surprisingly disciplined.',
  rarity: 'nice',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/swordsman-goblin.webp',
  attack: 9,
  defense: 5,
  cost: 0,
  characterType: 'goblin',
  comboSource: {
    characterName: 'Goblin Brawler',
    arsenalName: 'Chipped Broadsword',
  },
  set: SET,
});

export const PassiveAggressive = new ComboResultCard({
  name: 'Passive Aggressive',
  description: "I TOLD YOU I AM FINE! NO YOU HAVE A PROBLEM!",
  rarity: 'nice',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/passive-aggressive.webp',
  attack: 11,
  defense: 4,
  cost: 0,
  characterType: 'goblin',
  comboSource: {
    characterName: 'Goblin Brawler',
    arsenalName: 'Dented Buckler',
  },
  set: SET,
});

export const ShamanBlade = new ComboResultCard({
  name: 'Shaman Blade',
  description: 'A mushroom-blessed sword that hits harder than it should.',
  rarity: 'special',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/shaman-blade.webp',
  attack: 10,
  defense: 6,
  cost: 0,
  characterType: 'goblin',
  comboSource: {
    characterName: 'Goblin Shaman',
    arsenalName: 'Chipped Broadsword',
  },
  effects: [
    {
      id: 'shaman-combo-bonus',
      trigger: 'on-combo',
      description: 'Combo: deal 2 bonus damage.',
      handler: 'combo_bonus_attack',
      params: { amount: 2 },
    },
  ],
  set: SET,
});

export const WardedShaman = new ComboResultCard({
  name: 'Warded Shaman',
  description: 'Mystic buckler infused with fungal magic. Extremely durable.',
  rarity: 'special',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/warded-shaman.webp',
  attack: 6,
  defense: 10,
  cost: 0,
  characterType: 'goblin',
  comboSource: {
    characterName: 'Goblin Shaman',
    arsenalName: 'Dented Buckler',
  },
  effects: [
    {
      id: 'warded-shaman-heal',
      trigger: 'on-combo',
      description: 'Combo: restore 2 HP.',
      handler: 'heal_owner',
      params: { amount: 2 },
    },
  ],
  set: SET,
});

export const GoblinWarlord = new ComboResultCard({
  name: 'Goblin Warlord',
  description: 'The Chief with a sword is basically unstoppable. Basically.',
  rarity: 'nice',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/goblin-warlord.webp',
  attack: 11,
  defense: 3,
  cost: 0,
  characterType: 'goblin',
  comboSource: {
    characterName: 'Goblin Chief',
    arsenalName: 'Chipped Broadsword',
  },
  set: SET,
});

export const CaptainBrave = new ComboResultCard({
  name: 'Captain Brave',
  description: 'Shield raised, chin out, somehow still standing. A legend in the making.',
  rarity: 'special',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/captain-brave.webp',
  attack: 8,
  defense: 9,
  cost: 0,
  characterType: 'goblin',
  comboSource: {
    characterName: 'Goblin Chief',
    arsenalName: 'Dented Buckler',
  },
  effects: [
    {
      id: 'captain-brave-heal',
      trigger: 'on-combo',
      description: 'Combo: restore 2 HP. For the people!',
      handler: 'heal_owner',
      params: { amount: 2 },
    },
  ],
  set: SET,
});

// ── Opponent monster combos ─────────────────────────────────────────────

export const ArmedTroll = new ComboResultCard({
  name: 'Armed Troll',
  description: 'Give a troll a hammer and get out of the way.',
  rarity: 'nice',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/armed-troll.webp',
  attack: 10,
  defense: 6,
  cost: 0,
  characterType: 'beast',
  comboSource: { characterName: 'Troll Brute', arsenalName: 'Bone Hammer' },
  set: SET,
});

export const RampagingOgre = new ComboResultCard({
  name: 'Rampaging Ogre',
  description: 'An ogre with a hammer is not something you want to face.',
  rarity: 'nice',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/rampaging-ogre.webp',
  attack: 11,
  defense: 5,
  cost: 0,
  characterType: 'beast',
  comboSource: { characterName: 'Ogre Warrior', arsenalName: 'Bone Hammer' },
  set: SET,
});

export const RampagingBear = new ComboResultCard({
  name: 'Rampaging Bear',
  description: 'A cave bear armed with a bone hammer. An absolute nightmare.',
  rarity: 'nice',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/rampaging-bear.webp',
  attack: 12,
  defense: 7,
  cost: 0,
  characterType: 'beast',
  comboSource: { characterName: 'Cave Bear', arsenalName: 'Bone Hammer' },
  set: SET,
});

export const GiantSpider = new ComboResultCard({
  name: 'Giant Spider',
  description:
    'Whatever was in that vial, it worked. Eight legs and zero mercy.',
  rarity: 'nice',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/giant-spider.webp',
  attack: 9,
  defense: 5,
  cost: 0,
  characterType: 'beast',
  comboSource: { characterName: 'Regular Spider', arsenalName: 'Genetically Privileged' },
  set: SET,
});

// ── Player goblin shield combo ──────────────────────────────────────────

export const Fortified = new ComboResultCard({
  name: 'Fortified',
  description:
    'Wrapped in enchanted obsidian, this goblin has become an immovable force. Nothing gets through.',
  rarity: 'special',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/fortified.webp',
  attack: 0,
  defense: 15,
  cost: 0,
  characterType: 'goblin',
  comboSource: { characterName: 'Goblin Brawler', arsenalName: 'Goblin Shield' },
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
  SwordsmanGoblin,
  PassiveAggressive,
  ShamanBlade,
  WardedShaman,
  GoblinWarlord,
  CaptainBrave,
  ArmedTroll,
  RampagingOgre,
  RampagingBear,
  GiantSpider,
  Fortified,
];
