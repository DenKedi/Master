/* ═══════════════════════════════════════════════════════════════════════════
 *  Battle Engine — Type Definitions
 *  Pure data types for the simultaneous-turn combo card battle system.
 *
 *  Game loop:
 *  1. Both players select moves simultaneously (character, combo, tricks, dest)
 *  2. Combos resolve (Character + Arsenal → new specialised card via recipe)
 *  3. Effects activate
 *  4. Both active cards attack each other at the same time
 *  5. Draw → next turn
 * ═══════════════════════════════════════════════════════════════════════════ */

// ─── Card types used within the battle context ─────────────────────────────

export type BattleCardType = 'character' | 'arsenal' | 'destination' | 'trick';

/** When an effect triggers */
export type EffectTrigger =
  | 'on-play'
  | 'on-combo' // when a combo produces a new card
  | 'on-attack'
  | 'on-defend'
  | 'on-death'
  | 'passive'
  | 'on-discard';

/** When a trick resolves within the turn */
export type TrickTiming = 'before-combat' | 'after-combat';

/** An effect attached to a card */
export interface CardEffect {
  id: string;
  trigger: EffectTrigger;
  description: string;
  /** Effect handler key mapped to effects registry */
  handler: string;
  /** Arbitrary params for the handler */
  params?: Record<string, number | string | boolean>;
  /** When this trick fires — defaults to 'before-combat' */
  timing?: TrickTiming;
}

/** A card as it exists inside the battle engine (no DB ids needed) */
export interface BattleCard {
  uid: string; // unique instance id within the battle
  name: string;
  description: string;
  type: BattleCardType;
  imageUrl: string;
  attack: number;
  defense: number;
  effects: CardEffect[];
  /** Visual rarity — for styling only */
  rarity: string;
  /** Character subtype (only for character cards) */
  characterType?: string;
  /** If this card was created via combo, the source info */
  comboSource?: { characterName: string; arsenalName: string };
}

// ─── Combo Recipes ─────────────────────────────────────────────────────────

/**
 * A combo recipe: Character + Arsenal → Result card.
 * Multiple recipes can produce the same result card.
 * E.g. Red Dragon (character) + Surfboard (arsenal) → Water Dragon
 */
export interface BattleComboRecipe {
  /** Character card name (matched case-insensitive) */
  characterName: string;
  /** Arsenal card name (matched case-insensitive) */
  arsenalName: string;
  /** The resulting combo card */
  result: BattleCard;
}

// ─── Turn Selection ────────────────────────────────────────────────────────

/**
 * Player's pending selections for the current turn.
 * Both players fill these in simultaneously during the 'select' phase.
 */
export interface TurnSelection {
  /** UID of a character card from hand to play as active (replaces current) */
  characterUid: string | null;
  /** UID of an arsenal card from hand to combo with the active character */
  comboArsenalUid: string | null;
  /** UIDs of trick cards to play */
  trickUids: string[];
  /** UID of a destination card to play */
  destinationUid: string | null;
  /** Has this player locked in their choices? */
  confirmed: boolean;
}

export function emptySelection(): TurnSelection {
  return {
    characterUid: null,
    comboArsenalUid: null,
    trickUids: [],
    destinationUid: null,
    confirmed: false,
  };
}

// ─── Board state ───────────────────────────────────────────────────────────

export interface PlayerState {
  id: string; // 'player' | 'opponent' or a user id
  name: string;
  hp: number;
  maxHp: number;
  deck: BattleCard[]; // draw pile (face-down)
  hand: BattleCard[]; // cards in hand
  discard: BattleCard[]; // discard pile
  /** The active fighter card (plain character or combo result) */
  active: BattleCard | null;
  /** Arsenal equipped to the active character for this turn (dropped at turn end) */
  activeArsenal: BattleCard | null;
  /** Original character before a combo — combo reverts at end of turn */
  preComboCharacter: BattleCard | null;
  /** Current turn selection (staged moves before confirmation) */
  selection: TurnSelection;
  /** Whether this player has drawn their card this turn */
  hasDrawnThisTurn: boolean;
}

/** Only one destination can be in play at a time (shared field) */
export interface FieldState {
  destination: BattleCard | null;
  /** Who played the destination */
  destinationOwner: string | null;
}

// ─── Phases ────────────────────────────────────────────────────────────────

/**
 * Simultaneous turn phases:
 * - 'select': Both players choose moves (character, combo, tricks, destination)
 * - 'resolve': Auto-phase — combos form, effects fire, simultaneous combat
 */
export type TurnPhase = 'select' | 'resolve';

// ─── Game State ────────────────────────────────────────────────────────────

export interface GameState {
  /** Current turn number (starts at 1) */
  turn: number;
  phase: TurnPhase;
  player: PlayerState;
  opponent: PlayerState;
  field: FieldState;
  /** History of all actions taken */
  log: GameLogEntry[];
  /** Is the game over? */
  winner: string | 'tie' | null; // player id, 'tie', or null if ongoing
  /** Combo recipes available in this battle */
  comboRecipes: BattleComboRecipe[];
  /** Turn counter for first turn */
  isFirstTurn: boolean;
}

// ─── Actions ───────────────────────────────────────────────────────────────

/**
 * Actions a player can submit during the 'select' phase.
 * Both players submit independently. Resolution triggers when both confirm.
 */
export type GameAction =
  | { type: 'SELECT_CHARACTER'; cardUid: string }
  | { type: 'SELECT_COMBO'; arsenalUid: string }
  | { type: 'DESELECT_COMBO' }
  | { type: 'PLAY_TRICK'; cardUid: string }
  | { type: 'REMOVE_TRICK'; cardUid: string }
  | { type: 'PLAY_DESTINATION'; cardUid: string }
  | { type: 'REMOVE_DESTINATION'; cardUid: string }
  | { type: 'CONFIRM_SELECTION' }
  | { type: 'UNDO_SELECTION' }
  | { type: 'DRAW_CARD' };

// ─── Events (for UI animations) ───────────────────────────────────────────

export type GameEvent =
  | { type: 'CARD_DRAWN'; playerId: string; card: BattleCard }
  | { type: 'CARD_PLAYED'; playerId: string; card: BattleCard; slot: string }
  | {
      type: 'CHARACTER_PLACED';
      playerId: string;
      card: BattleCard;
      oldActive: BattleCard | null;
    }
  | {
      type: 'COMBO_RESOLVED';
      playerId: string;
      character: BattleCard;
      arsenal: BattleCard;
      result: BattleCard;
    }
  | {
      type: 'DESTINATION_PLAYED';
      playerId: string;
      card: BattleCard;
      replaced?: BattleCard;
    }
  | { type: 'TRICK_PLAYED'; playerId: string; card: BattleCard }
  | {
      type: 'SIMULTANEOUS_COMBAT';
      playerCard: BattleCard;
      opponentCard: BattleCard;
      playerAttack: number;
      playerDefense: number;
      opponentAttack: number;
      opponentDefense: number;
      damageToPlayer: number;
      damageToOpponent: number;
      playerHpBefore: number;
      playerHpAfter: number;
      playerMaxHp: number;
      opponentHpBefore: number;
      opponentHpAfter: number;
      opponentMaxHp: number;
    }
  | { type: 'HP_CHANGED'; playerId: string; newHp: number; delta: number }
  | { type: 'PHASE_CHANGED'; phase: TurnPhase }
  | { type: 'TURN_STARTED'; turn: number }
  | { type: 'GAME_OVER'; winnerId: string | 'tie' }
  | {
      type: 'EFFECT_TRIGGERED';
      card: BattleCard;
      effect: CardEffect;
      description: string;
    }
  | { type: 'SELECTION_CONFIRMED'; playerId: string }
  | { type: 'SELECTION_RESET'; playerId: string }
  | { type: 'HAND_REDEALT'; playerId: string }
  | {
      type: 'ARSENAL_EQUIPPED';
      playerId: string;
      arsenal: BattleCard;
      character: BattleCard;
    }
  | { type: 'ARSENAL_DROPPED'; playerId: string; arsenal: BattleCard }
  | {
      type: 'COMBO_REVERTED';
      playerId: string;
      comboCard: BattleCard;
      originalCharacter: BattleCard;
    };

// ─── Log ───────────────────────────────────────────────────────────────────

export interface GameLogEntry {
  turn: number;
  playerId: string;
  action: string;
  detail?: string;
  timestamp: number;
}

// ─── Engine Result ─────────────────────────────────────────────────────────

export interface ActionResult {
  state: GameState;
  events: GameEvent[];
  error?: string;
}
