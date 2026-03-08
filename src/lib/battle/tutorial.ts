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
  GoblinBrawler,
  GoblinShaman,
  GoblinChief,
  CaveBear,
  RegularSpider,
} from '@/lib/cards/sets/legacy-base/characters';
import {
  ChippedBroadsword,
  DentedBuckler,
  BoneHammer,
  GeneticallyPrivileged,
  GoblinShield,
} from '@/lib/cards/sets/legacy-base/arsenal';
import { GoblinWarren } from '@/lib/cards/sets/legacy-base/destinations';
import {
  DubiousPotion,
  SalvageRune,
} from '@/lib/cards/sets/legacy-base/tricks';
import {
  SwordsmanGoblin,
  PassiveAggressive,
  ShamanBlade,
  WardedShaman,
  GoblinWarlord,
  CaptainBrave,
  RampagingBear,
  GiantSpider,
  Fortified,
} from '@/lib/cards/sets/legacy-base/combos';

// ─── Tutorial Cards (derived from registry classes) ────────────────────

export const TUTORIAL_CARDS = {
  // ── Player goblin characters ──
  brawler: GoblinBrawler.toBattleCard('tut-brawler'),
  shaman: GoblinShaman.toBattleCard('tut-shaman'),
  chief: GoblinChief.toBattleCard('tut-chief'),

  // ── Player arsenal ──
  sword: ChippedBroadsword.toBattleCard('tut-sword'),
  shield: DentedBuckler.toBattleCard('tut-shield'),
  goblinShield: GoblinShield.toBattleCard('tut-goblin-shield'),

  // ── Player destination ──
  warren: GoblinWarren.toBattleCard('tut-warren'),

  // ── Player tricks ──
  healPotion: DubiousPotion.toBattleCard('tut-heal'),
  arsenalRecovery: SalvageRune.toBattleCard('tut-recover'),

  // ── Player goblin combo result cards ──
  swordsmanGoblin: SwordsmanGoblin.toBattleCard('tut-combo-swordsman'),
  passiveAggressive: PassiveAggressive.toBattleCard('tut-combo-passive-aggressive'),
  shamanBlade: ShamanBlade.toBattleCard('tut-combo-shaman-blade'),
  wardedShaman: WardedShaman.toBattleCard('tut-combo-warded-shaman'),
  goblinWarlord: GoblinWarlord.toBattleCard('tut-combo-warlord'),
  captainBrave: CaptainBrave.toBattleCard('tut-combo-captain-brave'),
  fortified: Fortified.toBattleCard('tut-combo-fortified'),

  // ── Opponent monster characters ──
  spider: RegularSpider.toBattleCard('tut-spider'),
  bear: CaveBear.toBattleCard('tut-bear'),

  // ── Opponent arsenal ──
  hammer: BoneHammer.toBattleCard('tut-hammer'),
  geneticallyPrivileged: GeneticallyPrivileged.toBattleCard('tut-gen-priv'),

  // ── Opponent monster combo results ──
  giantSpider: GiantSpider.toBattleCard('tut-combo-giant-spider'),
  rampagingBear: RampagingBear.toBattleCard('tut-combo-rampaging-bear'),
} satisfies Record<string, BattleCard>;

// ─── Tutorial Combo Recipes ────────────────────────────────────────────────

export const TUTORIAL_COMBO_RECIPES: BattleComboRecipe[] = [
  // ── Player goblin combos ──
  {
    characterName: 'Goblin Brawler',
    arsenalName: 'Chipped Broadsword',
    result: TUTORIAL_CARDS.swordsmanGoblin,
  },
  {
    characterName: 'Goblin Brawler',
    arsenalName: 'Dented Buckler',
    result: TUTORIAL_CARDS.passiveAggressive,
  },
  {
    characterName: 'Goblin Brawler',
    arsenalName: 'Goblin Shield',
    result: TUTORIAL_CARDS.fortified,
  },
  {
    characterName: 'Goblin Shaman',
    arsenalName: 'Chipped Broadsword',
    result: TUTORIAL_CARDS.shamanBlade,
  },
  {
    characterName: 'Goblin Shaman',
    arsenalName: 'Dented Buckler',
    result: TUTORIAL_CARDS.wardedShaman,
  },
  {
    characterName: 'Goblin Chief',
    arsenalName: 'Chipped Broadsword',
    result: TUTORIAL_CARDS.goblinWarlord,
  },
  {
    characterName: 'Goblin Chief',
    arsenalName: 'Dented Buckler',
    result: TUTORIAL_CARDS.captainBrave,
  },
  // ── Opponent monster combos ──
  {
    characterName: 'Regular Spider',
    arsenalName: 'Genetically Privileged',
    result: TUTORIAL_CARDS.giantSpider,
  },
  {
    characterName: 'Cave Bear',
    arsenalName: 'Bone Hammer',
    result: TUTORIAL_CARDS.rampagingBear,
  },
];

// ─── Scripted Decks (for tutorial — fixed order, no shuffle) ───────────────

/** Player's tutorial deck — the starting hand is the first 4 cards */
export const TUTORIAL_PLAYER_DECK: BattleCard[] = [
  // Starting hand (first 4 are dealt)
  // Both combos available immediately: Brawler+Buckler=PassiveAggressive, Chief+Buckler=CaptainBrave
  TUTORIAL_CARDS.brawler, // character
  TUTORIAL_CARDS.shield, // Dented Buckler — combos with both brawler and chief
  TUTORIAL_CARDS.chief, // character — ready for Captain Brave combo
  TUTORIAL_CARDS.warren, // destination (goblin-type boost)
  // Rest of deck (drawn from end: last item drawn first)
  TUTORIAL_CARDS.healPotion, // trick (before combat) — drawn soon after
  TUTORIAL_CARDS.arsenalRecovery, // trick (after combat)
  TUTORIAL_CARDS.shaman,
  TUTORIAL_CARDS.sword,
  { ...TUTORIAL_CARDS.brawler, uid: 'tut-brawler-2' },
  { ...TUTORIAL_CARDS.shield, uid: 'tut-shield-2' },
  { ...TUTORIAL_CARDS.shaman, uid: 'tut-shaman-2' },
  { ...TUTORIAL_CARDS.chief, uid: 'tut-chief-2' },
  { ...TUTORIAL_CARDS.sword, uid: 'tut-sword-2' },
  TUTORIAL_CARDS.goblinShield,
];

/** Opponent's tutorial monster deck — no tricks.
 *  AI plays Regular Spider turn 1, combos into Giant Spider turn 2 (9/5).
 *  Cave Bear takes over later, comboing into Rampaging Bear (12/7).
 */
export const TUTORIAL_OPPONENT_DECK: BattleCard[] = [
  // Starting hand (first 4) — spider + gen-priv in hand for turn-2 combo
  TUTORIAL_CARDS.spider, // character — AI picks first
  TUTORIAL_CARDS.geneticallyPrivileged, // arsenal — combos on turn 2
  TUTORIAL_CARDS.bear, // character — late-game bruiser
  TUTORIAL_CARDS.hammer, // arsenal — for bear combo
  // Rest (drawn from end: last drawn first)
  { ...TUTORIAL_CARDS.bear, uid: 'tut-bear-2' },
  { ...TUTORIAL_CARDS.hammer, uid: 'tut-hammer-2' },
  { ...TUTORIAL_CARDS.spider, uid: 'tut-spider-2' },
  { ...TUTORIAL_CARDS.geneticallyPrivileged, uid: 'tut-gen-priv-2' },
  { ...TUTORIAL_CARDS.bear, uid: 'tut-bear-3' },
  { ...TUTORIAL_CARDS.hammer, uid: 'tut-hammer-3' },
  { ...TUTORIAL_CARDS.spider, uid: 'tut-spider-3' },
  { ...TUTORIAL_CARDS.geneticallyPrivileged, uid: 'tut-gen-priv-3' },
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
      'Every battle needs a champion. Select your Goblin Brawler to send into the arena.',
    instruction:
      'Click on **Goblin Brawler** in your hand to select it as your active fighter. Characters are your main fighters — they have Attack and Defense stats used in combat.',
    highlight: ['[data-card="tut-brawler"]', '[data-area="player-active"]'],
    requiredAction: 'SELECT_CHARACTER',
    requiredCardUid: 'tut-brawler',
    blocking: false,
    expectedPhase: 'select',
  },
  {
    id: 2,
    title: 'Combo Time!',
    description:
      'Characters can fuse with Arsenal cards to create something stronger.',
    instruction:
      'Now select the **Dented Buckler** to combo it with your Brawler! Character + Arsenal = a brand new **Combo Card** with better stats.\n\nGoblin Brawler + Dented Buckler = **Passive Aggressive** (11 ATK / 4 DEF)!\n\nYou also have the **Goblin Chief** in hand — combo him with the Buckler later for **Captain Brave** (8 ATK / 9 DEF + a heal)!',
    highlight: ['[data-card="tut-shield"]', '[data-area="player-active"]'],
    requiredAction: 'SELECT_COMBO',
    requiredCardUid: 'tut-shield',
    blocking: false,
    expectedPhase: 'select',
  },
  {
    id: 3,
    title: 'Confirm!',
    description: 'Lock in your choices and let battle commence.',
    instruction:
      'Click **Confirm** to lock in your selections. Once both you and your opponent have confirmed, the turn resolves:\n\n1. Characters are placed\n2. Combos are formed\n3. Tricks & effects activate\n4. Both fighters attack **simultaneously**\n\n**Combat math:** Your Attack minus their Defense = damage to their HP (and vice versa at the same time!).',
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
      "Great hit! Now let's explore your other options:\n\n• **Destinations** change the battlefield — only one active at a time. The **Goblin Warren** only boosts *your* goblin characters, not the enemy monsters!\n• **Tricks** are spells that fire off during the turn — heals, damage, and more.\n\nTry playing the **Goblin Warren** or the **Dubious Potion** alongside your fighter this turn!",
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
