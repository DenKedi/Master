/* ═══════════════════════════════════════════════════════════════════════════
 *  Battle Engine — Tutorial
 *  Scripted cards, decks, combo recipes, and step definitions for the
 *  guided tutorial.
 *
 *  The tutorial is a fixed, scripted experience — card stats are hardcoded
 *  here rather than loaded from the DB, so it always plays consistently.
 *  Effects are imported from the card definitions.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { BattleCard, BattleComboRecipe, GameAction } from './types';

// Import card definitions for effects
import goblinBungler from '@/lib/cards/sets/legacy-base/cards/goblin-bungler';
import goblinChief from '@/lib/cards/sets/legacy-base/cards/goblin-chief';
import regularSpider from '@/lib/cards/sets/legacy-base/cards/regular-spider';
import deadMatesSword from '@/lib/cards/sets/legacy-base/cards/dead-mates-sword';
import dentedBuckler from '@/lib/cards/sets/legacy-base/cards/dented-buckler';
import geneticallyPrivileged from '@/lib/cards/sets/legacy-base/cards/genetically-privileged';
import goblinShield from '@/lib/cards/sets/legacy-base/cards/goblin-shield';
import goblinWarren from '@/lib/cards/sets/legacy-base/cards/goblin-warren';
import dubiousPotion from '@/lib/cards/sets/legacy-base/cards/dubious-potion';
import salvageRune from '@/lib/cards/sets/legacy-base/cards/salvage-rune';
import rudeGesture from '@/lib/cards/sets/legacy-base/cards/rude-gesture';
import swordsmanGoblinDef from '@/lib/cards/sets/legacy-base/cards/swordsman-goblin';
import passiveAggressiveDef from '@/lib/cards/sets/legacy-base/cards/passive-aggressive';
import captainBraveDef from '@/lib/cards/sets/legacy-base/cards/captain-brave';
import giantSpiderDef from '@/lib/cards/sets/legacy-base/cards/giant-spider';
import fortifiedGoblinDef from '@/lib/cards/sets/legacy-base/cards/fortified-goblin';
import infernalZonkDef from '@/lib/cards/sets/legacy-base/cards/infernal-zonk';

// ─── Tutorial Cards (scripted with fixed stats) ────────────────────────

export const TUTORIAL_CARDS = {
  // ── Player goblin characters ──
  brawler: {
    uid: 'tut-brawler', cardId: goblinBungler.id, name: 'Goblin bungler',
    description: 'Short, fierce, and always looking for trouble.',
    type: 'character', imageUrl: goblinBungler.imageUrl,
    attack: 5, defense: 3, effects: goblinBungler.effects,
    rarity: 'normal', characterType: 'goblin',
  } as BattleCard,
  chief: {
    uid: 'tut-chief', cardId: goblinChief.id, name: 'Goblin Chief',
    description: 'Commands with aggression and questionable strategy.',
    type: 'character', imageUrl: goblinChief.imageUrl,
    attack: 7, defense: 2, effects: goblinChief.effects,
    rarity: 'normal', characterType: 'goblin',
  } as BattleCard,

  // ── Player arsenal ──
  sword: {
    uid: 'tut-sword', cardId: deadMatesSword.id, name: "Your Dead Mate's Sword",
    description: 'Bring it to an End.',
    type: 'arsenal', imageUrl: deadMatesSword.imageUrl,
    attack: 3, defense: 1, effects: deadMatesSword.effects,
    rarity: 'normal',
  } as BattleCard,
  shield: {
    uid: 'tut-shield', cardId: dentedBuckler.id, name: 'Dented Buckler',
    description: 'Blocks attacks. Sometimes. Best used facing forward.',
    type: 'arsenal', imageUrl: dentedBuckler.imageUrl,
    attack: 1, defense: 4, effects: dentedBuckler.effects,
    rarity: 'normal',
  } as BattleCard,
  goblinShield: {
    uid: 'tut-goblin-shield', cardId: goblinShield.id, name: 'Goblin Shield',
    description: 'A tower shield forged from enchanted obsidian.',
    type: 'arsenal', imageUrl: goblinShield.imageUrl,
    attack: 0, defense: 3, effects: goblinShield.effects,
    rarity: 'special',
  } as BattleCard,

  // ── Player destination ──
  warren: {
    uid: 'tut-warren', cardId: goblinWarren.id, name: 'Goblin Warren',
    description: 'A cramped but loyal hideout. Goblins fight fiercer here.',
    type: 'destination', imageUrl: goblinWarren.imageUrl,
    attack: 0, defense: 0, effects: goblinWarren.effects,
    rarity: 'normal',
  } as BattleCard,

  // ── Player tricks ──
  healPotion: {
    uid: 'tut-heal', cardId: dubiousPotion.id, name: 'Dubious Potion',
    description: 'Tastes like feet, heals like magic.',
    type: 'trick', imageUrl: dubiousPotion.imageUrl,
    attack: 0, defense: 0, effects: dubiousPotion.effects,
    rarity: 'normal',
  } as BattleCard,
  arsenalRecovery: {
    uid: 'tut-recover', cardId: salvageRune.id, name: 'Salvage Rune',
    description: 'A glowing rune that yanks your weapon back before it breaks.',
    type: 'trick', imageUrl: salvageRune.imageUrl,
    attack: 0, defense: 0, effects: salvageRune.effects,
    rarity: 'nice',
  } as BattleCard,
  rudeGesture: {
    uid: 'tut-rude-gesture', cardId: rudeGesture.id, name: 'Rude Gesture',
    description: 'The opponent makes a very rude gesture.',
    type: 'trick', imageUrl: rudeGesture.imageUrl,
    attack: 0, defense: 0, effects: rudeGesture.effects,
    rarity: 'normal',
  } as BattleCard,

  // ── Player goblin combo result cards ──
  swordsmanGoblin: {
    uid: 'tut-combo-swordsman', cardId: swordsmanGoblinDef.id, name: 'Swordsman Goblin',
    description: "Found a sword. Still doesn't know how to use it.",
    type: 'character', imageUrl: swordsmanGoblinDef.imageUrl,
    attack: 6, defense: 3, effects: swordsmanGoblinDef.effects,
    rarity: 'nice', characterType: 'goblin',
  } as BattleCard,
  passiveAggressive: {
    uid: 'tut-combo-passive-aggressive', cardId: passiveAggressiveDef.id, name: 'Passive Aggressive',
    description: 'Hides behind a shield and hurls insults.',
    type: 'character', imageUrl: passiveAggressiveDef.imageUrl,
    attack: 5, defense: 5, effects: passiveAggressiveDef.effects,
    rarity: 'nice', characterType: 'goblin',
  } as BattleCard,
  captainBrave: {
    uid: 'tut-combo-captain-brave', cardId: captainBraveDef.id, name: 'Captain Brave',
    description: 'Leads from the back, now with extra protection.',
    type: 'character', imageUrl: captainBraveDef.imageUrl,
    attack: 7, defense: 4, effects: captainBraveDef.effects,
    rarity: 'nice', characterType: 'goblin',
  } as BattleCard,
  fortified: {
    uid: 'tut-combo-fortified', cardId: fortifiedGoblinDef.id, name: 'Fortified Goblin',
    description: 'Unhinged.',
    type: 'character', imageUrl: fortifiedGoblinDef.imageUrl,
    attack: 5, defense: 9, effects: fortifiedGoblinDef.effects,
    rarity: 'special', characterType: 'goblin',
  } as BattleCard,

  // ── Opponent monster characters ──
  spider: {
    uid: 'tut-spider', cardId: regularSpider.id, name: 'Regular Spider',
    description: 'Eight legs, eight problems.',
    type: 'character', imageUrl: regularSpider.imageUrl,
    attack: 3, defense: 2, effects: regularSpider.effects,
    rarity: 'normal', characterType: 'beast',
  } as BattleCard,

  // ── Opponent arsenal ──
  geneticallyPrivileged: {
    uid: 'tut-gen-priv', cardId: geneticallyPrivileged.id, name: 'Genetically Privileged',
    description: 'Pure potential in card form.',
    type: 'arsenal', imageUrl: geneticallyPrivileged.imageUrl,
    attack: 0, defense: 0, effects: geneticallyPrivileged.effects,
    rarity: 'nice',
  } as BattleCard,

  // ── Opponent monster combo results ──
  giantSpider: {
    uid: 'tut-combo-giant-spider', cardId: giantSpiderDef.id, name: 'Giant Spider',
    description: 'No longer small. Significantly more problematic.',
    type: 'character', imageUrl: giantSpiderDef.imageUrl,
    attack: 8, defense: 6, effects: giantSpiderDef.effects,
    rarity: 'special', characterType: 'beast',
  } as BattleCard,
} satisfies Record<string, BattleCard>;

// ─── Tutorial Combo Recipes ────────────────────────────────────────────────

export const TUTORIAL_COMBO_RECIPES: BattleComboRecipe[] = [
  // ── Player goblin combos ──
  {
    characterName: 'Goblin bungler',
    arsenalName: "Your Dead Mate's Sword",
    result: TUTORIAL_CARDS.swordsmanGoblin,
    bonus: { attack: 3, defense: 1 },
  },
  {
    characterName: 'Goblin bungler',
    arsenalName: 'Dented Buckler',
    result: TUTORIAL_CARDS.passiveAggressive,
    bonus: { attack: 1, defense: 4 },
  },
  {
    characterName: 'Goblin bungler',
    arsenalName: 'Goblin Shield',
    result: TUTORIAL_CARDS.fortified,
    bonus: { attack: 0, defense: 3 },
  },
  {
    characterName: 'Goblin Chief',
    arsenalName: 'Dented Buckler',
    result: TUTORIAL_CARDS.captainBrave,
    bonus: { attack: 1, defense: 4 },
  },
  {
    characterName: 'Goblin Chief',
    arsenalName: 'Goblin Shield',
    result: TUTORIAL_CARDS.fortified,
    bonus: { attack: 0, defense: 3 },
  },
  // ── Opponent monster combos ──
  {
    characterName: 'Regular Spider',
    arsenalName: 'Genetically Privileged',
    result: TUTORIAL_CARDS.giantSpider,
    bonus: { attack: 0, defense: 0 },
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
  TUTORIAL_CARDS.goblinShield, TUTORIAL_CARDS.sword,
  { ...TUTORIAL_CARDS.brawler, uid: 'tut-brawler-2' },
  { ...TUTORIAL_CARDS.shield, uid: 'tut-shield-2' },
  { ...TUTORIAL_CARDS.goblinShield, uid: 'tut-shaman-2' },
  TUTORIAL_CARDS.rudeGesture,
  { ...TUTORIAL_CARDS.sword, uid: 'tut-sword-2' },
  TUTORIAL_CARDS.goblinShield,
];

/**
 * Starter deck card IDs + quantities granted on tutorial completion.
 * Total must equal MIN_DECK_SIZE (10).
 */
export const STARTER_DECK_CARDS: { cardId: string; quantity: number }[] = [
  { cardId: 'goblin-bungler', quantity: 2 },
  { cardId: 'rude-gesture', quantity: 2 },
  { cardId: 'dead-mates-sword', quantity: 2 },
  { cardId: 'dented-buckler', quantity: 2 },
  { cardId: 'goblin-warren', quantity: 1 },
  { cardId: 'dubious-potion', quantity: 1 },
];

/** Opponent's tutorial monster deck — no tricks.
 *  AI always combos: Spider + Genetically Privileged = Giant Spider (12/6).
 */
export const TUTORIAL_OPPONENT_DECK: BattleCard[] = [
  // Starting hand (first 4) — spider + gen-priv for immediate Giant Spider combo
  TUTORIAL_CARDS.spider,
  TUTORIAL_CARDS.geneticallyPrivileged,
  TUTORIAL_CARDS.spider, TUTORIAL_CARDS.geneticallyPrivileged, // Rest (drawn from end: last drawn first)
  { ...TUTORIAL_CARDS.geneticallyPrivileged, uid: 'tut-gen-priv-2' },
  { ...TUTORIAL_CARDS.spider, uid: 'tut-spider-2' },
  { ...TUTORIAL_CARDS.geneticallyPrivileged, uid: 'tut-hammer-2' },
  { ...TUTORIAL_CARDS.spider, uid: 'tut-bear-2' },
  { ...TUTORIAL_CARDS.geneticallyPrivileged, uid: 'tut-hammer-3' },
  { ...TUTORIAL_CARDS.spider, uid: 'tut-spider-3' },
  { ...TUTORIAL_CARDS.geneticallyPrivileged, uid: 'tut-gen-priv-3' },
  { ...TUTORIAL_CARDS.spider, uid: 'tut-spider-4' },
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
      'Every battle needs a champion. Select your Goblin bungler to send into the arena.',
    instruction:
      'Click on **Goblin bungler** in your hand to select it as your active fighter. Characters are your main fighters — they have Attack and Defense stats used in combat.',
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
      'Now select the **Dented Buckler** to combo it with your bungler! Character + Arsenal = a brand new **Combo Card** with better stats.\n\nGoblin bungler + Dented Buckler = **Passive Aggressive** (11 ATK / 4 DEF)!\n\nYou also have the **Goblin Chief** in hand — combo him with the Buckler later for **Captain Brave** (8 ATK / 9 DEF + a heal)!',
    highlight: ['[data-card="tut-shield"]', '[data-area="player-active"]'],
    requiredAction: 'SELECT_COMBO',
    requiredCardUid: 'tut-shield',
    blocking: false,
    expectedPhase: 'select',
  },
  {
    id: 3,
    title: 'Use Your Arsenal!',
    description: 'Confirm the arsenal to form your combo card.',
    instruction:
      'Now click **Use Arsenal** to fuse your character with the arsenal! The combo will resolve immediately and your new **Passive Aggressive** will appear in the active slot.\n\nYou can still play tricks after this!',
    highlight: ['[data-action="confirm-arsenal"]'],
    requiredAction: 'CONFIRM_ARSENAL',
    blocking: false,
    expectedPhase: 'select',
  },
  {
    id: 4,
    title: 'Confirm!',
    description: 'Lock in your choices and let battle commence.',
    instruction:
      'Click **Confirm** to lock in your selections. Once both you and your opponent have confirmed, the turn resolves:\n\n1. Characters are placed\n2. Tricks & effects activate\n3. Both fighters attack **simultaneously**\n\n**Combat math:** Your Attack minus their Defense = damage to their HP (and vice versa at the same time!).',
    highlight: ['[data-action="confirm"]'],
    requiredAction: 'CONFIRM_SELECTION',
    blocking: false,
    expectedPhase: 'select',
  },
  {
    id: 5,
    title: 'Destinations & Tricks',
    description: 'There are more cards to play than just fighters.',
    instruction:
      "Great hit! Now let's explore your other options:\n\n• **Destinations** change the battlefield — only one active at a time. The **Goblin Warren** only boosts *your* goblin characters, not the enemy monsters!\n• **Tricks** are spells that fire off during the turn — heals, damage, and more.\n\nTry playing the **Goblin Warren** or the **Dubious Potion** alongside your fighter this turn!",
    highlight: ['[data-area="player-hand"]'],
    blocking: true,
  },
  {
    id: 6,
    title: 'Your Turn, Commander!',
    description: 'You know the basics. Now finish the fight!',
    instruction:
      'The tutorial guide is stepping back. Play freely and defeat your opponent! Remember:\n\n• Both players select moves **simultaneously**\n• **Select** a character, optionally **combo** with an arsenal\n• Click **Use Arsenal** to confirm the combo\n• Play **tricks** and **destinations** for extra effects\n• **Confirm** to lock in — combat resolves when both players are ready\n• Reduce opponent to **0 HP** to win!\n\nGood luck, minion.',
    blocking: false,
  },
];

/** Total tutorial steps count */
export const TOTAL_TUTORIAL_STEPS = TUTORIAL_STEPS.length;
