/* ═══════════════════════════════════════════════════════════════════════════
 *  Battle Engine — Tutorial
 *  Scripted cards, decks, combo recipes, and step definitions for the
 *  guided tutorial.
 *
 *  Cards are sourced from the card registry (legacy-base set).
 *  The registry is populated on import of the set module.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { BattleCard, BattleComboRecipe, GameAction } from './types';

// Import set to populate registry
import '@/lib/cards/sets/legacy-base';

import {
  BumblingSquire,
  RustyKnight,
  SwampWitch,
  SnottyGoblin,
  ConfusedOrc,
} from '@/lib/cards/sets/legacy-base/characters';
import {
  ChippedBroadsword,
  DentedBuckler,
  GnarlyClub,
} from '@/lib/cards/sets/legacy-base/arsenal';
import { CrumblingCourtyard } from '@/lib/cards/sets/legacy-base/destinations';
import {
  DubiousPotion,
  SalvageRune,
  RudeGesture,
} from '@/lib/cards/sets/legacy-base/tricks';
import {
  ArmedSquire,
  FortifiedKnight,
  HexBladeWitch,
  ShieldedSquire,
  GreatswordKnight,
  WardedWitch,
  ArmedGoblin,
  RagingOrc,
} from '@/lib/cards/sets/legacy-base/combos';

// ─── Tutorial Cards (derived from registry classes) ────────────────────

export const TUTORIAL_CARDS = {
  // ── Player characters ──
  squire: BumblingSquire.toBattleCard('tut-squire'),
  knight: RustyKnight.toBattleCard('tut-knight'),
  witch: SwampWitch.toBattleCard('tut-witch'),

  // ── Player arsenal ──
  sword: ChippedBroadsword.toBattleCard('tut-sword'),
  shield: DentedBuckler.toBattleCard('tut-shield'),

  // ── Player destination ──
  courtyard: CrumblingCourtyard.toBattleCard('tut-courtyard'),

  // ── Player tricks ──
  healPotion: DubiousPotion.toBattleCard('tut-heal'),
  arsenalRecovery: SalvageRune.toBattleCard('tut-recover'),

  // ── Combo result cards ──
  armedSquire: ArmedSquire.toBattleCard('tut-combo-armed-squire'),
  fortifiedKnight: FortifiedKnight.toBattleCard('tut-combo-fort-knight'),
  hexBlade: HexBladeWitch.toBattleCard('tut-combo-hex-blade'),
  shieldedSquire: ShieldedSquire.toBattleCard('tut-combo-shield-squire'),
  armedKnight: GreatswordKnight.toBattleCard('tut-combo-armed-knight'),
  hexShieldWitch: WardedWitch.toBattleCard('tut-combo-hex-shield'),

  // ── Opponent characters ──
  goblin: SnottyGoblin.toBattleCard('tut-goblin'),
  orc: ConfusedOrc.toBattleCard('tut-orc'),

  // ── Opponent arsenal ──
  club: GnarlyClub.toBattleCard('tut-club'),

  // ── Opponent trick ──
  taunt: RudeGesture.toBattleCard('tut-taunt'),

  // ── Opponent combo results ──
  armedGoblin: ArmedGoblin.toBattleCard('tut-combo-armed-goblin'),
  ragingOrc: RagingOrc.toBattleCard('tut-combo-raging-orc'),
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
