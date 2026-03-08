/* ═══════════════════════════════════════════════════════════════════════════
 *  Battle Engine — Tutorial
 *  Scripted cards, decks, combo recipes, and step definitions for the
 *  guided tutorial.  These cards exist only in the tutorial context — no
 *  DB dependency.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { BattleCard, BattleComboRecipe, GameAction } from './types';

// ─── Tutorial Cards ────────────────────────────────────────────────────────

export const TUTORIAL_CARDS = {
  // ── Player characters ──
  squire: {
    uid: 'tut-squire',
    name: 'Bumbling Squire',
    description: 'Eager but clumsy. Always trips on his own cape.',
    type: 'character' as const,
    imageUrl: '/cards/tutorial/squire.webp',
    attack: 5,
    defense: 3,
    effects: [],
    rarity: 'normal',
    characterType: 'human',
  },
  knight: {
    uid: 'tut-knight',
    name: 'Rusty Knight',
    description: 'His armor squeaks louder than his battle cry.',
    type: 'character' as const,
    imageUrl: '/cards/tutorial/knight.webp',
    attack: 6,
    defense: 4,
    effects: [],
    rarity: 'nice',
    characterType: 'human',
  },
  witch: {
    uid: 'tut-witch',
    name: 'Swamp Witch',
    description: 'Smells weird, but has great aim with hexes.',
    type: 'character' as const,
    imageUrl: '/cards/tutorial/witch.webp',
    attack: 7,
    defense: 2,
    effects: [],
    rarity: 'normal',
    characterType: 'human',
  },

  // ── Player arsenal ──
  sword: {
    uid: 'tut-sword',
    name: 'Chipped Broadsword',
    description: "It's seen better days, and so has its owner.",
    type: 'arsenal' as const,
    imageUrl: '/cards/tutorial/sword.webp',
    attack: 3,
    defense: 1,
    effects: [],
    rarity: 'normal',
  },
  shield: {
    uid: 'tut-shield',
    name: 'Dented Buckler',
    description: 'Blocks attacks. Sometimes. Best used facing forward.',
    type: 'arsenal' as const,
    imageUrl: '/cards/tutorial/shield.webp',
    attack: 1,
    defense: 4,
    effects: [],
    rarity: 'normal',
  },

  // ── Player destination ──
  courtyard: {
    uid: 'tut-courtyard',
    name: 'Crumbling Courtyard',
    description:
      'An ancient training ground. The stones whisper encouragement.',
    type: 'destination' as const,
    imageUrl: '/cards/tutorial/courtyard.webp',
    attack: 0,
    defense: 0,
    effects: [
      {
        id: 'courtyard-boost',
        trigger: 'passive' as const,
        description: 'All characters gain +1 Attack while in the Courtyard.',
        handler: 'boost_attack',
        params: { amount: 1 },
      },
    ],
    rarity: 'normal',
  },

  // ── Player tricks ──
  healPotion: {
    uid: 'tut-heal',
    name: 'Dubious Potion',
    description: 'Tastes like feet, heals like magic.',
    type: 'trick' as const,
    imageUrl: '/cards/tutorial/potion.webp',
    attack: 0,
    defense: 0,
    effects: [
      {
        id: 'heal-3',
        trigger: 'on-play' as const,
        description: 'Before Combat: Restore 3 HP.',
        handler: 'heal_owner',
        params: { amount: 3 },
        timing: 'before-combat' as const,
      },
    ],
    rarity: 'normal',
  },
  arsenalRecovery: {
    uid: 'tut-recover',
    name: 'Salvage Rune',
    description: 'A glowing rune that yanks your weapon back before it breaks.',
    type: 'trick' as const,
    imageUrl: '/cards/tutorial/salvage-rune.webp',
    attack: 0,
    defense: 0,
    effects: [
      {
        id: 'recover-arsenal',
        trigger: 'on-play' as const,
        description: 'After Combat: Return arsenal to hand.',
        handler: 'recover_arsenal',
        timing: 'after-combat' as const,
      },
    ],
    rarity: 'nice',
  },

  // ── Combo result cards (produced by Character + Arsenal) ──
  armedSquire: {
    uid: 'tut-combo-armed-squire',
    name: 'Armed Squire',
    description: 'Still trips, but now he trips INTO enemies. With a sword.',
    type: 'character' as const,
    imageUrl: '/cards/tutorial/armed-squire.webp',
    attack: 9,
    defense: 5,
    effects: [],
    rarity: 'nice',
    comboSource: {
      characterName: 'Bumbling Squire',
      arsenalName: 'Chipped Broadsword',
    },
    characterType: 'human',
  },
  fortifiedKnight: {
    uid: 'tut-combo-fort-knight',
    name: 'Fortified Knight',
    description: 'A walking fortress that squeaks with every step.',
    type: 'character' as const,
    imageUrl: '/cards/tutorial/fortified-knight.webp',
    attack: 7,
    defense: 9,
    effects: [],
    rarity: 'nice',
    comboSource: {
      characterName: 'Rusty Knight',
      arsenalName: 'Dented Buckler',
    },
    characterType: 'human',
  },
  hexBlade: {
    uid: 'tut-combo-hex-blade',
    name: 'Hex Blade Witch',
    description: 'A sword enchanted with swamp magic. Extra slimy.',
    type: 'character' as const,
    imageUrl: '/cards/tutorial/hex-blade.webp',
    attack: 11,
    defense: 3,
    effects: [
      {
        id: 'hex-combo-bonus',
        trigger: 'on-combo' as const,
        description: 'Combo: deal 2 bonus damage.',
        handler: 'combo_bonus_attack',
        params: { amount: 2 },
      },
    ],
    rarity: 'special',
    comboSource: {
      characterName: 'Swamp Witch',
      arsenalName: 'Chipped Broadsword',
    },
    characterType: 'human',
  },
  shieldedSquire: {
    uid: 'tut-combo-shield-squire',
    name: 'Shielded Squire',
    description:
      'Hides behind a shield bigger than himself. Surprisingly effective.',
    type: 'character' as const,
    imageUrl: '/cards/tutorial/shielded-squire.webp',
    attack: 6,
    defense: 8,
    effects: [],
    rarity: 'nice',
    comboSource: {
      characterName: 'Bumbling Squire',
      arsenalName: 'Dented Buckler',
    },
    characterType: 'human',
  },
  armedKnight: {
    uid: 'tut-combo-armed-knight',
    name: 'Greatsword Knight',
    description: 'Dual-wielding rust and determination. Loud and lethal.',
    type: 'character' as const,
    imageUrl: '/cards/tutorial/armed-knight.webp',
    attack: 10,
    defense: 5,
    effects: [],
    rarity: 'nice',
    comboSource: {
      characterName: 'Rusty Knight',
      arsenalName: 'Chipped Broadsword',
    },
    characterType: 'human',
  },
  hexShieldWitch: {
    uid: 'tut-combo-hex-shield',
    name: 'Warded Witch',
    description:
      'A magical barrier of swamp gas. Smells terrible, deflects everything.',
    type: 'character' as const,
    imageUrl: '/cards/tutorial/warded-witch.webp',
    attack: 8,
    defense: 6,
    effects: [
      {
        id: 'ward-combo-heal',
        trigger: 'on-combo' as const,
        description: 'Combo: restore 2 HP.',
        handler: 'heal_owner',
        params: { amount: 2 },
      },
    ],
    rarity: 'special',
    comboSource: {
      characterName: 'Swamp Witch',
      arsenalName: 'Dented Buckler',
    },
    characterType: 'human',
  },

  // ── Opponent characters ──
  goblin: {
    uid: 'tut-goblin',
    name: 'Snotty Goblin',
    description: 'Picks fights and noses with equal enthusiasm.',
    type: 'character' as const,
    imageUrl: '/cards/tutorial/goblin.webp',
    attack: 3,
    defense: 2,
    effects: [],
    rarity: 'normal',
    characterType: 'goblin',
  },
  orc: {
    uid: 'tut-orc',
    name: 'Confused Orc',
    description: "Not sure why he's here. Hits hard anyway.",
    type: 'character' as const,
    imageUrl: '/cards/tutorial/orc.webp',
    attack: 4,
    defense: 3,
    effects: [],
    rarity: 'normal',
    characterType: 'beast',
  },

  // ── Opponent arsenal ──
  club: {
    uid: 'tut-club',
    name: 'Gnarly Club',
    description: 'A stick. A big, angry stick.',
    type: 'arsenal' as const,
    imageUrl: '/cards/tutorial/club.webp',
    attack: 2,
    defense: 1,
    effects: [],
    rarity: 'normal',
  },

  // ── Opponent trick ──
  taunt: {
    uid: 'tut-taunt',
    name: 'Rude Gesture',
    description:
      'The opponent makes a very rude gesture. It hurts your feelings and your HP.',
    type: 'trick' as const,
    imageUrl: '/cards/tutorial/taunt.webp',
    attack: 0,
    defense: 0,
    effects: [
      {
        id: 'taunt-dmg',
        trigger: 'on-play' as const,
        description: 'Before Combat: Deal 2 direct damage.',
        handler: 'damage_opponent',
        params: { amount: 2 },
        timing: 'before-combat' as const,
      },
    ],
    rarity: 'normal',
  },

  // ── Opponent combo result ──
  armedGoblin: {
    uid: 'tut-combo-armed-goblin',
    name: 'Armed Goblin',
    description: 'Still disgusting, but now armed and dangerous.',
    type: 'character' as const,
    imageUrl: '/cards/tutorial/armed-goblin.webp',
    attack: 6,
    defense: 3,
    effects: [],
    rarity: 'nice',
    comboSource: { characterName: 'Snotty Goblin', arsenalName: 'Gnarly Club' },
    characterType: 'goblin',
  },
  ragingOrc: {
    uid: 'tut-combo-raging-orc',
    name: 'Raging Orc',
    description: 'Finally figured out why he is here. Now everyone pays.',
    type: 'character' as const,
    imageUrl: '/cards/tutorial/raging-orc.webp',
    attack: 7,
    defense: 4,
    effects: [],
    rarity: 'nice',
    comboSource: { characterName: 'Confused Orc', arsenalName: 'Gnarly Club' },
    characterType: 'beast',
  },
} satisfies Record<string, BattleCard>;

// ─── Tutorial Combo Recipes ────────────────────────────────────────────────

export const TUTORIAL_COMBO_RECIPES: BattleComboRecipe[] = [
  {
    characterName: 'Bumbling Squire',
    arsenalName: 'Chipped Broadsword',
    result: TUTORIAL_CARDS.armedSquire,
  },
  {
    characterName: 'Rusty Knight',
    arsenalName: 'Dented Buckler',
    result: TUTORIAL_CARDS.fortifiedKnight,
  },
  {
    characterName: 'Swamp Witch',
    arsenalName: 'Chipped Broadsword',
    result: TUTORIAL_CARDS.hexBlade,
  },
  {
    characterName: 'Snotty Goblin',
    arsenalName: 'Gnarly Club',
    result: TUTORIAL_CARDS.armedGoblin,
  },
  // New cross-combos
  {
    characterName: 'Bumbling Squire',
    arsenalName: 'Dented Buckler',
    result: TUTORIAL_CARDS.shieldedSquire,
  },
  {
    characterName: 'Rusty Knight',
    arsenalName: 'Chipped Broadsword',
    result: TUTORIAL_CARDS.armedKnight,
  },
  {
    characterName: 'Swamp Witch',
    arsenalName: 'Dented Buckler',
    result: TUTORIAL_CARDS.hexShieldWitch,
  },
  {
    characterName: 'Confused Orc',
    arsenalName: 'Gnarly Club',
    result: TUTORIAL_CARDS.ragingOrc,
  },
];

// ─── Scripted Decks (for tutorial — fixed order, no shuffle) ───────────────

/** Player's tutorial deck — the starting hand is the first 4 cards */
export const TUTORIAL_PLAYER_DECK: BattleCard[] = [
  // Starting hand (first 4 are dealt)
  TUTORIAL_CARDS.squire, // character — guaranteed in hand
  TUTORIAL_CARDS.sword, // arsenal — combo ready
  TUTORIAL_CARDS.courtyard, // destination
  TUTORIAL_CARDS.healPotion, // trick (before combat)
  // Rest of deck (drawn during play)
  TUTORIAL_CARDS.arsenalRecovery, // trick (after combat)
  TUTORIAL_CARDS.knight,
  TUTORIAL_CARDS.shield,
  TUTORIAL_CARDS.witch,
  { ...TUTORIAL_CARDS.squire, uid: 'tut-squire-2' },
  { ...TUTORIAL_CARDS.sword, uid: 'tut-sword-2' },
  { ...TUTORIAL_CARDS.knight, uid: 'tut-knight-2' },
  { ...TUTORIAL_CARDS.shield, uid: 'tut-shield-2' },
  { ...TUTORIAL_CARDS.witch, uid: 'tut-witch-2' },
];

/** Opponent's tutorial deck — intentionally weak */
export const TUTORIAL_OPPONENT_DECK: BattleCard[] = [
  // Starting hand (first 4 — AI starts simple)
  TUTORIAL_CARDS.goblin, // character
  TUTORIAL_CARDS.club, // arsenal
  TUTORIAL_CARDS.taunt, // trick
  TUTORIAL_CARDS.orc, // character backup
  // Rest
  { ...TUTORIAL_CARDS.goblin, uid: 'tut-goblin-2' },
  { ...TUTORIAL_CARDS.club, uid: 'tut-club-2' },
  { ...TUTORIAL_CARDS.orc, uid: 'tut-orc-2' },
  { ...TUTORIAL_CARDS.taunt, uid: 'tut-taunt-2' },
  { ...TUTORIAL_CARDS.goblin, uid: 'tut-goblin-3' },
  { ...TUTORIAL_CARDS.club, uid: 'tut-club-3' },
  { ...TUTORIAL_CARDS.orc, uid: 'tut-orc-3' },
  { ...TUTORIAL_CARDS.taunt, uid: 'tut-taunt-3' },
];

// ─── Tutorial Step Definitions ─────────────────────────────────────────────

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  /** Detailed instructional text shown in the overlay */
  instruction: string;
  /** CSS selector(s) to highlight (spotlight) */
  highlight?: string[];
  /** The action the player must perform to complete this step (null = auto-advance) */
  requiredAction?: GameAction['type'];
  /** Specific card uid that must be used (when applicable) */
  requiredCardUid?: string;
  /** AI actions to perform before/after this step */
  aiPreActions?: GameAction[];
  /** Should the overlay be blocking (forced) or just a tooltip? */
  blocking: boolean;
  /** Phase the game should be in for this step */
  expectedPhase?: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 0,
    title: 'Welcome, Minion!',
    description:
      "The Dark Lord demands competence. Let's see if you can handle a card battle.",
    instruction:
      "This is your hand — the cards at the bottom of the screen. You have 4 cards to start with. Cards come in 4 types: **Characters** (fighters), **Arsenal** (combo materials), **Destinations** (battlefield effects), and **Tricks** (spells).\n\nIn this game, both players select their moves at the same time, then everything resolves simultaneously!\n\nLet's begin by selecting your first fighter.",
    highlight: ['[data-area="player-hand"]'],
    blocking: true,
  },
  {
    id: 1,
    title: 'Select Your Fighter',
    description:
      'Every battle needs a champion. Select your Bumbling Squire to send into the arena.',
    instruction:
      'Click on **Bumbling Squire** in your hand to select it as your active fighter. Characters are your main fighters — they have Attack and Defense stats used in combat.',
    highlight: ['[data-card="tut-squire"]', '[data-area="player-active"]'],
    requiredAction: 'SELECT_CHARACTER',
    requiredCardUid: 'tut-squire',
    blocking: false,
    expectedPhase: 'select',
  },
  {
    id: 2,
    title: 'Combo Time!',
    description:
      'Characters can fuse with Arsenal cards to create something stronger.',
    instruction:
      'Now select your **Chipped Broadsword** to combo it with your Squire! Character + Arsenal = a brand new **Combo Card** with better stats.\n\nBumbling Squire + Chipped Broadsword = **Armed Squire** (9 ATK / 5 DEF)!\n\nNot all combos work — you can only combine cards that have a valid recipe.',
    highlight: ['[data-card="tut-sword"]', '[data-area="player-active"]'],
    requiredAction: 'SELECT_COMBO',
    requiredCardUid: 'tut-sword',
    blocking: false,
    expectedPhase: 'select',
  },
  {
    id: 3,
    title: 'Confirm & Fight!',
    description: 'Lock in your choices and let battle commence.',
    instruction:
      'Click **Confirm & Fight** to lock in your selections. Once both you and your opponent have confirmed, the turn resolves:\n\n1. Characters are placed\n2. Combos are formed\n3. Tricks & effects activate\n4. Both fighters attack **simultaneously**\n\n**Combat math:** Your Attack minus their Defense = damage to their HP (and vice versa at the same time!).',
    highlight: ['[data-action="confirm"]'],
    requiredAction: 'CONFIRM_SELECTION',
    blocking: false,
    expectedPhase: 'select',
  },
  {
    id: 4,
    title: 'Destinations & Tricks',
    description: 'There are more cards to play than just fighters.',
    instruction:
      "Great hit! Now let's explore your other options:\n\n• **Destinations** change the battlefield — only one can be active at a time. They affect both players!\n• **Tricks** are spells that fire off during the turn — heals, damage, and more.\n\nTry playing the **Crumbling Courtyard** or the **Dubious Potion** alongside your fighter this turn!",
    highlight: ['[data-area="player-hand"]'],
    blocking: true,
  },
  {
    id: 5,
    title: 'Your Turn, Commander!',
    description: 'You know the basics. Now finish the fight!',
    instruction:
      'The tutorial guide is stepping back. Play freely and defeat your opponent! Remember:\n\n• Both players select moves **simultaneously**\n• **Select** a character, optionally **combo** with an arsenal\n• Play **tricks** and **destinations** for extra effects\n• **Confirm** to lock in — combat resolves when both players are ready\n• Reduce opponent to **0 HP** to win!\n\nGood luck, minion.',
    blocking: false,
  },
];

/** Total tutorial steps count */
export const TOTAL_TUTORIAL_STEPS = TUTORIAL_STEPS.length;
