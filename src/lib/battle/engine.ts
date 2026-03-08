/* ═══════════════════════════════════════════════════════════════════════════
 *  Battle Engine — Core
 *  Pure functional engine: applyAction(state, action, playerId) → result
 *
 *  Simultaneous 1v1 rules:
 *  - 20 HP per player, 20-card deck, 4-card starting hand (≥1 char)
 *  - Each turn both players draw 1 card (except first turn)
 *  - Select phase: both players pick character, combo, tricks, destination
 *  - Resolve phase (auto): characters placed → combos resolve → tricks fire
 *    → destinations placed → simultaneous combat (both attack at once)
 *  - Combos: Character + Arsenal → new specialised card (via recipe)
 *  - Combat: each player's active ATK − opponent's active DEF = damage (min 0)
 *  - Win: reduce opponent HP to 0
 * ═══════════════════════════════════════════════════════════════════════════ */

import type {
  GameState,
  GameAction,
  ActionResult,
  GameEvent,
  BattleCard,
  PlayerState,
  GameLogEntry,
  BattleComboRecipe,
  TurnSelection,
} from './types';
import { emptySelection } from './types';
import { isValidAction } from './validate';
import { resolveEffect, resolveEffects } from './effects';
import { STARTING_HP, STARTING_HAND_SIZE, MIN_DAMAGE } from './constants';

// ─── Helpers ───────────────────────────────────────────────────────────────

function log(
  state: GameState,
  playerId: string,
  action: string,
  detail?: string,
): GameLogEntry {
  return { turn: state.turn, playerId, action, detail, timestamp: Date.now() };
}

/** Shuffle an array (Fisher-Yates) — returns new array */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Look up a combo recipe for a character + arsenal pair */
export function findComboRecipe(
  recipes: BattleComboRecipe[],
  characterName: string,
  arsenalName: string,
): BattleComboRecipe | undefined {
  const charLower = characterName.toLowerCase();
  const arsLower = arsenalName.toLowerCase();
  return recipes.find(
    r =>
      r.characterName.toLowerCase() === charLower &&
      r.arsenalName.toLowerCase() === arsLower,
  );
}

/** Get all valid combos a player can do given their hand and active character */
export function getAvailableCombos(
  state: GameState,
  playerId: string,
): { arsenalUid: string; arsenalName: string; result: BattleCard }[] {
  const player = state.player.id === playerId ? state.player : state.opponent;
  const charToCheck = player.selection.characterUid
    ? player.hand.find(c => c.uid === player.selection.characterUid)
    : player.active;

  if (!charToCheck || charToCheck.type !== 'character') return [];

  const arsenals = player.hand.filter(c => c.type === 'arsenal');
  const combos: {
    arsenalUid: string;
    arsenalName: string;
    result: BattleCard;
  }[] = [];

  for (const ars of arsenals) {
    const recipe = findComboRecipe(
      state.comboRecipes,
      charToCheck.name,
      ars.name,
    );
    if (recipe) {
      combos.push({
        arsenalUid: ars.uid,
        arsenalName: ars.name,
        result: {
          ...recipe.result,
          uid: `combo-${charToCheck.uid}-${ars.uid}`,
        },
      });
    }
  }

  return combos;
}

// ─── Create initial game state ─────────────────────────────────────────────

export interface InitOptions {
  playerDeck: BattleCard[];
  opponentDeck: BattleCard[];
  playerId?: string;
  opponentId?: string;
  playerName?: string;
  opponentName?: string;
  /** Combo recipes available in this battle */
  comboRecipes?: BattleComboRecipe[];
  /** Skip shuffle (for scripted tutorial) */
  skipShuffle?: boolean;
}

/** Check if hand contains at least one character card */
function hasCharacterInHand(hand: BattleCard[]): boolean {
  return hand.some(c => c.type === 'character');
}

/**
 * Deal starting hands. If a hand has no character, re-deal (up to 3 attempts)
 * then force at least one character from the deck.
 */
function dealStartingHand(
  deck: BattleCard[],
  handSize: number,
): { hand: BattleCard[]; deck: BattleCard[]; redealt: boolean } {
  let attempts = 0;
  let currentDeck = [...deck];
  let hand: BattleCard[] = [];
  let redealt = false;

  while (attempts < 3) {
    hand = currentDeck.slice(0, handSize);
    currentDeck = currentDeck.slice(handSize);

    if (hasCharacterInHand(hand)) {
      return { hand, deck: currentDeck, redealt };
    }

    // Put cards back and reshuffle
    currentDeck = shuffle([...hand, ...currentDeck]);
    hand = [];
    redealt = true;
    attempts++;
  }

  // Force: find the first character in the deck and swap with a hand card
  hand = currentDeck.slice(0, handSize);
  currentDeck = currentDeck.slice(handSize);
  const charIdx = currentDeck.findIndex(c => c.type === 'character');
  if (charIdx !== -1) {
    const swap = hand[0];
    hand[0] = currentDeck[charIdx];
    currentDeck[charIdx] = swap;
    redealt = true;
  }

  return { hand, deck: currentDeck, redealt };
}

export function createInitialState(opts: InitOptions): {
  state: GameState;
  events: GameEvent[];
} {
  const playerId = opts.playerId ?? 'player';
  const opponentId = opts.opponentId ?? 'opponent';

  const playerDeck = opts.skipShuffle
    ? [...opts.playerDeck]
    : shuffle(opts.playerDeck);
  const opponentDeck = opts.skipShuffle
    ? [...opts.opponentDeck]
    : shuffle(opts.opponentDeck);

  const playerDeal = dealStartingHand(playerDeck, STARTING_HAND_SIZE);
  const opponentDeal = dealStartingHand(opponentDeck, STARTING_HAND_SIZE);

  const events: GameEvent[] = [];

  if (playerDeal.redealt) {
    events.push({ type: 'HAND_REDEALT', playerId });
  }
  if (opponentDeal.redealt) {
    events.push({ type: 'HAND_REDEALT', playerId: opponentId });
  }

  const player: PlayerState = {
    id: playerId,
    name: opts.playerName ?? 'Player',
    hp: STARTING_HP,
    maxHp: STARTING_HP,
    deck: playerDeal.deck,
    hand: playerDeal.hand,
    discard: [],
    active: null,
    activeArsenal: null,
    preComboCharacter: null,
    selection: emptySelection(),
    hasDrawnThisTurn: true,
  };

  const opponent: PlayerState = {
    id: opponentId,
    name: opts.opponentName ?? 'Opponent',
    hp: STARTING_HP,
    maxHp: STARTING_HP,
    deck: opponentDeal.deck,
    hand: opponentDeal.hand,
    discard: [],
    active: null,
    activeArsenal: null,
    preComboCharacter: null,
    selection: emptySelection(),
    hasDrawnThisTurn: true,
  };

  const state: GameState = {
    turn: 1,
    phase: 'select',
    player,
    opponent,
    field: { destination: null, destinationOwner: null },
    log: [],
    winner: null,
    comboRecipes: opts.comboRecipes ?? [],
    isFirstTurn: true,
  };

  events.push(
    { type: 'PHASE_CHANGED', phase: 'select' },
    { type: 'TURN_STARTED', turn: 1 },
  );

  return { state, events };
}

// ─── Apply action (both players can submit during 'select') ────────────────

export function applyAction(
  state: GameState,
  action: GameAction,
  playerId?: string,
): ActionResult {
  // Default playerId to player.id for backwards compat
  const pid = playerId ?? state.player.id;

  // Validate
  const validation = isValidAction(state, action, pid);
  if (!validation.valid) {
    return { state, events: [], error: validation.reason };
  }

  const isPlayer = pid === state.player.id;
  const actor: PlayerState = isPlayer ? state.player : state.opponent;
  const allEvents: GameEvent[] = [];

  const updateActor = (updated: PlayerState): GameState => {
    return isPlayer
      ? { ...state, player: updated }
      : { ...state, opponent: updated };
  };

  switch (action.type) {
    // ── Select a character from hand to play ──────────────────────
    case 'SELECT_CHARACTER': {
      const card = actor.hand.find(c => c.uid === action.cardUid);
      if (!card) return { state, events: [], error: 'Card not in hand.' };

      const newSelection: TurnSelection = {
        ...actor.selection,
        characterUid: action.cardUid,
        // Reset combo if character changed (combo depends on character)
        comboArsenalUid: null,
      };
      const updated = { ...actor, selection: newSelection };
      return { state: updateActor(updated), events: allEvents };
    }

    // ── Select an arsenal card to combo with ─────────────────────
    case 'SELECT_COMBO': {
      const arsenal = actor.hand.find(c => c.uid === action.arsenalUid);
      if (!arsenal) return { state, events: [], error: 'Arsenal not in hand.' };

      // Determine which character will be active for the combo
      const charForCombo = actor.selection.characterUid
        ? actor.hand.find(c => c.uid === actor.selection.characterUid)
        : actor.active;

      if (!charForCombo) {
        return { state, events: [], error: 'No character to combo with.' };
      }

      // Validate a recipe exists
      const recipe = findComboRecipe(
        state.comboRecipes,
        charForCombo.name,
        arsenal.name,
      );
      if (!recipe) {
        return { state, events: [], error: 'No combo recipe for this pair.' };
      }

      const newSelection: TurnSelection = {
        ...actor.selection,
        comboArsenalUid: action.arsenalUid,
      };
      const updated = { ...actor, selection: newSelection };
      return { state: updateActor(updated), events: allEvents };
    }

    // ── Deselect combo ───────────────────────────────────────────
    case 'DESELECT_COMBO': {
      const newSelection: TurnSelection = {
        ...actor.selection,
        comboArsenalUid: null,
      };
      const updated = { ...actor, selection: newSelection };
      return { state: updateActor(updated), events: allEvents };
    }

    // ── Stage a trick ────────────────────────────────────────────
    case 'PLAY_TRICK': {
      const card = actor.hand.find(c => c.uid === action.cardUid);
      if (!card) return { state, events: [], error: 'Card not in hand.' };

      const newSelection: TurnSelection = {
        ...actor.selection,
        trickUids: [...actor.selection.trickUids, action.cardUid],
      };
      const updated = { ...actor, selection: newSelection };
      return { state: updateActor(updated), events: allEvents };
    }

    // ── Remove a staged trick ────────────────────────────────────
    case 'REMOVE_TRICK': {
      const newSelection: TurnSelection = {
        ...actor.selection,
        trickUids: actor.selection.trickUids.filter(
          uid => uid !== action.cardUid,
        ),
      };
      const updated = { ...actor, selection: newSelection };
      return { state: updateActor(updated), events: allEvents };
    }

    // ── Stage a destination ──────────────────────────────────────
    case 'PLAY_DESTINATION': {
      const card = actor.hand.find(c => c.uid === action.cardUid);
      if (!card) return { state, events: [], error: 'Card not in hand.' };

      const newSelection: TurnSelection = {
        ...actor.selection,
        destinationUid: action.cardUid,
      };
      const updated = { ...actor, selection: newSelection };
      return { state: updateActor(updated), events: allEvents };
    }

    // ── Unstage a destination ────────────────────────────────────
    case 'REMOVE_DESTINATION': {
      const newSelection: TurnSelection = {
        ...actor.selection,
        destinationUid: null,
      };
      const updated = { ...actor, selection: newSelection };
      return { state: updateActor(updated), events: allEvents };
    }

    // ── Draw a card from deck ────────────────────────────────────
    case 'DRAW_CARD': {
      if (actor.deck.length === 0) {
        return { state, events: [], error: 'Deck is empty.' };
      }
      const newDeck = [...actor.deck];
      const drawn = newDeck.pop()!;
      const updated = {
        ...actor,
        deck: newDeck,
        hand: [...actor.hand, drawn],
        hasDrawnThisTurn: true,
      };
      allEvents.push({ type: 'CARD_DRAWN', playerId: pid, card: drawn });
      return { state: updateActor(updated), events: allEvents };
    }

    // ── Confirm selection ────────────────────────────────────────
    case 'CONFIRM_SELECTION': {
      const newSelection: TurnSelection = {
        ...actor.selection,
        confirmed: true,
      };
      const updated = { ...actor, selection: newSelection };
      let newState = updateActor(updated);

      allEvents.push({ type: 'SELECTION_CONFIRMED', playerId: pid });

      // Check if both players have confirmed → resolve the turn
      const otherPlayer = isPlayer ? newState.opponent : newState.player;
      if (otherPlayer.selection.confirmed) {
        const resolveResult = resolveTurn(newState);
        return {
          state: resolveResult.state,
          events: [...allEvents, ...resolveResult.events],
        };
      }

      return { state: newState, events: allEvents };
    }

    // ── Undo (reset) selection ───────────────────────────────────
    case 'UNDO_SELECTION': {
      const updated = { ...actor, selection: emptySelection() };
      allEvents.push({ type: 'SELECTION_RESET', playerId: pid });
      return { state: updateActor(updated), events: allEvents };
    }

    default:
      return { state, events: [], error: 'Unknown action.' };
  }
}

// ─── Turn Resolution ───────────────────────────────────────────────────────

/**
 * Resolve an entire turn once both players have confirmed.
 * Order: characters → destinations → tricks → combos → combat → draw → next turn
 */
function resolveTurn(state: GameState): ActionResult {
  const events: GameEvent[] = [];
  let s: GameState = { ...state, phase: 'resolve' };
  events.push({ type: 'PHASE_CHANGED', phase: 'resolve' });

  // 1. Resolve character plays for both players
  s = resolveCharacterPlay(s, s.player.id, events);
  s = resolveCharacterPlay(s, s.opponent.id, events);

  // 2. Resolve destinations
  s = resolveDestinationPlay(s, s.player.id, events);
  s = resolveDestinationPlay(s, s.opponent.id, events);

  // 3. Resolve tricks — before-combat timing
  s = resolveTrickPlays(s, s.player.id, events, 'before-combat');
  s = resolveTrickPlays(s, s.opponent.id, events, 'before-combat');

  // 4. Resolve combos
  s = resolveCombo(s, s.player.id, events);
  s = resolveCombo(s, s.opponent.id, events);

  // Check if game ended from effects
  if (s.winner) {
    return { state: s, events };
  }

  // 5. Resolve passive effects (destination / active card)
  s = resolvePassiveEffects(s, events);

  // 6. Simultaneous combat
  if (s.player.active && s.opponent.active) {
    s = resolveSimultaneousCombat(s, events);
  }

  // 6b. Resolve tricks — after-combat timing
  s = resolveTrickPlays(s, s.player.id, events, 'after-combat');
  s = resolveTrickPlays(s, s.opponent.id, events, 'after-combat');

  // Check win
  if (s.winner) {
    return { state: s, events };
  }

  // 7. Start next turn
  s = startNextTurn(s, events);

  return { state: s, events };
}

/** Place the selected character onto the active slot */
function resolveCharacterPlay(
  state: GameState,
  playerId: string,
  events: GameEvent[],
): GameState {
  const isPlayer = playerId === state.player.id;
  const actor = isPlayer ? state.player : state.opponent;
  const charUid = actor.selection.characterUid;

  if (!charUid) return state;

  const card = actor.hand.find(c => c.uid === charUid);
  if (!card) return state;

  const oldActive = actor.active;
  const newHand = actor.hand.filter(c => c.uid !== charUid);
  // When swapping character, discard old active, any equipped arsenal, and preComboCharacter
  const newDiscard = [
    ...actor.discard,
    ...(oldActive ? [oldActive] : []),
    ...(actor.activeArsenal ? [actor.activeArsenal] : []),
    ...(actor.preComboCharacter ? [actor.preComboCharacter] : []),
  ];

  const updated: PlayerState = {
    ...actor,
    hand: newHand,
    discard: newDiscard,
    active: card,
    activeArsenal: null,
    preComboCharacter: null,
  };

  events.push({
    type: 'CHARACTER_PLACED',
    playerId,
    card,
    oldActive,
  });

  // Resolve on-play effects for the character
  let newState: GameState = isPlayer
    ? { ...state, player: updated }
    : { ...state, opponent: updated };

  const effectResult = resolveEffects(newState, card, 'on-play', playerId);
  newState = effectResult.state;
  events.push(...effectResult.events);

  return newState;
}

/** Play the selected destination */
function resolveDestinationPlay(
  state: GameState,
  playerId: string,
  events: GameEvent[],
): GameState {
  const isPlayer = playerId === state.player.id;
  const actor = isPlayer ? state.player : state.opponent;
  const destUid = actor.selection.destinationUid;

  if (!destUid) return state;

  const card = actor.hand.find(c => c.uid === destUid);
  if (!card) return state;

  const newHand = actor.hand.filter(c => c.uid !== destUid);
  const oldDest = state.field.destination;

  // Old destination goes to its owner's discard
  let updatedActor: PlayerState = { ...actor, hand: newHand };
  const other = isPlayer ? state.opponent : state.player;
  let updatedOther = other;

  if (oldDest && state.field.destinationOwner) {
    if (state.field.destinationOwner === playerId) {
      updatedActor = {
        ...updatedActor,
        discard: [...updatedActor.discard, oldDest],
      };
    } else {
      updatedOther = {
        ...updatedOther,
        discard: [...updatedOther.discard, oldDest],
      };
    }
  }

  events.push({
    type: 'DESTINATION_PLAYED',
    playerId,
    card,
    replaced: oldDest ?? undefined,
  });

  let newState: GameState = isPlayer
    ? {
        ...state,
        player: updatedActor,
        opponent: updatedOther,
        field: { destination: card, destinationOwner: playerId },
      }
    : {
        ...state,
        player: updatedOther,
        opponent: updatedActor,
        field: { destination: card, destinationOwner: playerId },
      };

  // Resolve on-play effects
  const effectResult = resolveEffects(newState, card, 'on-play', playerId);
  newState = effectResult.state;
  events.push(...effectResult.events);

  return newState;
}

/** Play all staged tricks */
function resolveTrickPlays(
  state: GameState,
  playerId: string,
  events: GameEvent[],
  timing: 'before-combat' | 'after-combat',
): GameState {
  const isPlayer = playerId === state.player.id;
  let actor = isPlayer ? state.player : state.opponent;

  for (const trickUid of actor.selection.trickUids) {
    const card = actor.hand.find(c => c.uid === trickUid);
    if (!card) continue;

    // Check if this trick has effects matching the current timing
    const hasMatchingEffect = card.effects.some(
      e => e.trigger === 'on-play' && (e.timing ?? 'before-combat') === timing,
    );
    if (!hasMatchingEffect) continue;

    // Only remove from hand on the first timing that fires (before-combat)
    // If the card was already played (removed from hand), skip hand removal
    const stillInHand = actor.hand.some(c => c.uid === trickUid);
    if (stillInHand) {
      const newHand = actor.hand.filter(c => c.uid !== trickUid);
      const newDiscard = [...actor.discard, card];
      actor = { ...actor, hand: newHand, discard: newDiscard };
      events.push({ type: 'TRICK_PLAYED', playerId, card });
    }

    // Apply to state and resolve only matching-timing effects
    let newState: GameState = isPlayer
      ? { ...state, player: actor }
      : { ...state, opponent: actor };

    for (const effect of card.effects) {
      if (effect.trigger !== 'on-play') continue;
      if ((effect.timing ?? 'before-combat') !== timing) continue;
      const result = resolveEffect(newState, card, effect, playerId);
      newState = result.state;
      events.push(
        {
          type: 'EFFECT_TRIGGERED',
          card,
          effect,
          description: effect.description,
        },
        ...result.events,
      );
    }

    // Update actor from the new state
    actor = isPlayer ? newState.player : newState.opponent;
    state = newState;
  }

  return state;
}

/** Resolve combo (Character + Arsenal → new card) OR plain equip (no recipe → temporary arsenal boost) */
function resolveCombo(
  state: GameState,
  playerId: string,
  events: GameEvent[],
): GameState {
  const isPlayer = playerId === state.player.id;
  const actor = isPlayer ? state.player : state.opponent;
  const arsenalUid = actor.selection.comboArsenalUid;

  if (!arsenalUid) return state;
  if (!actor.active) return state;

  const arsenal = actor.hand.find(c => c.uid === arsenalUid);
  if (!arsenal) return state;

  const recipe = findComboRecipe(
    state.comboRecipes,
    actor.active.name,
    arsenal.name,
  );

  // ── No recipe: equip arsenal as one-turn stat boost ─────────────────────
  if (!recipe) {
    const newHand = actor.hand.filter(c => c.uid !== arsenalUid);
    const updated: PlayerState = {
      ...actor,
      hand: newHand,
      activeArsenal: arsenal,
    };
    events.push({
      type: 'ARSENAL_EQUIPPED',
      playerId,
      arsenal,
      character: actor.active,
    });
    return isPlayer
      ? { ...state, player: updated }
      : { ...state, opponent: updated };
  }

  // ── Recipe exists: create the combo result card ──────────────────────────
  const comboCard: BattleCard = {
    ...recipe.result,
    uid: `combo-${actor.active.uid}-${arsenal.uid}-t${state.turn}`,
    comboSource: {
      characterName: actor.active.name,
      arsenalName: arsenal.name,
    },
  };

  const oldActive = actor.active;
  const newHand = actor.hand.filter(c => c.uid !== arsenalUid);
  // Only discard the arsenal; the original character is saved for revert
  const newDiscard = [...actor.discard, arsenal];

  const updated: PlayerState = {
    ...actor,
    hand: newHand,
    discard: newDiscard,
    active: comboCard,
    preComboCharacter: oldActive,
  };

  events.push({
    type: 'COMBO_RESOLVED',
    playerId,
    character: oldActive,
    arsenal,
    result: comboCard,
  });

  let newState: GameState = isPlayer
    ? { ...state, player: updated }
    : { ...state, opponent: updated };

  // Resolve on-combo effects
  const effectResult = resolveEffects(
    newState,
    comboCard,
    'on-combo',
    playerId,
  );
  newState = effectResult.state;
  events.push(...effectResult.events);

  return newState;
}

/** Resolve passive effects for active cards and destination */
function resolvePassiveEffects(
  state: GameState,
  events: GameEvent[],
): GameState {
  let s = state;

  // Destination passive
  if (s.field.destination && s.field.destinationOwner) {
    const destEffects = resolveEffects(
      s,
      s.field.destination,
      'passive',
      s.field.destinationOwner,
    );
    s = destEffects.state;
    events.push(...destEffects.events);
  }

  // Player's active card passive
  if (s.player.active) {
    const pEffects = resolveEffects(s, s.player.active, 'passive', s.player.id);
    s = pEffects.state;
    events.push(...pEffects.events);
  }

  // Opponent's active card passive
  if (s.opponent.active) {
    const oEffects = resolveEffects(
      s,
      s.opponent.active,
      'passive',
      s.opponent.id,
    );
    s = oEffects.state;
    events.push(...oEffects.events);
  }

  return s;
}

/** Simultaneous combat — both active cards attack each other at the same time */
function resolveSimultaneousCombat(
  state: GameState,
  events: GameEvent[],
): GameState {
  const pCard = state.player.active;
  const oCard = state.opponent.active;

  if (!pCard || !oCard) return state;

  const playerAtk = pCard.attack + (state.player.activeArsenal?.attack ?? 0);
  const playerDef = pCard.defense + (state.player.activeArsenal?.defense ?? 0);
  const opponentAtk =
    oCard.attack + (state.opponent.activeArsenal?.attack ?? 0);
  const opponentDef =
    oCard.defense + (state.opponent.activeArsenal?.defense ?? 0);

  // Damage calculations (simultaneous)
  const damageToOpponent = Math.max(MIN_DAMAGE, playerAtk - opponentDef);
  const damageToPlayer = Math.max(MIN_DAMAGE, opponentAtk - playerDef);

  const newPlayerHp = Math.max(0, state.player.hp - damageToPlayer);
  const newOpponentHp = Math.max(0, state.opponent.hp - damageToOpponent);

  events.push({
    type: 'SIMULTANEOUS_COMBAT',
    playerCard: pCard,
    opponentCard: oCard,
    playerAttack: playerAtk,
    playerDefense: playerDef,
    opponentAttack: opponentAtk,
    opponentDefense: opponentDef,
    damageToPlayer,
    damageToOpponent,
    playerHpBefore: state.player.hp,
    playerHpAfter: newPlayerHp,
    playerMaxHp: state.player.maxHp,
    opponentHpBefore: state.opponent.hp,
    opponentHpAfter: newOpponentHp,
    opponentMaxHp: state.opponent.maxHp,
  });

  if (damageToPlayer > 0) {
    events.push({
      type: 'HP_CHANGED',
      playerId: state.player.id,
      newHp: newPlayerHp,
      delta: -damageToPlayer,
    });
  }
  if (damageToOpponent > 0) {
    events.push({
      type: 'HP_CHANGED',
      playerId: state.opponent.id,
      newHp: newOpponentHp,
      delta: -damageToOpponent,
    });
  }

  // Resolve on-attack effects for both
  let s: GameState = {
    ...state,
    player: { ...state.player, hp: newPlayerHp },
    opponent: { ...state.opponent, hp: newOpponentHp },
  };

  if (pCard) {
    const atkEffects = resolveEffects(s, pCard, 'on-attack', s.player.id);
    s = atkEffects.state;
    events.push(...atkEffects.events);
  }
  if (oCard) {
    const atkEffects = resolveEffects(s, oCard, 'on-attack', s.opponent.id);
    s = atkEffects.state;
    events.push(...atkEffects.events);
  }

  // Resolve on-defend effects for both
  if (pCard) {
    const defEffects = resolveEffects(s, pCard, 'on-defend', s.player.id);
    s = defEffects.state;
    events.push(...defEffects.events);
  }
  if (oCard) {
    const defEffects = resolveEffects(s, oCard, 'on-defend', s.opponent.id);
    s = defEffects.state;
    events.push(...defEffects.events);
  }

  // Check win — both can reach 0 simultaneously (draw goes to the attacker
  // with more damage dealt; if equal, player wins — home advantage)
  const pDead = s.player.hp <= 0;
  const oDead = s.opponent.hp <= 0;

  if (pDead && oDead) {
    // Both KO'd — whoever dealt more damage wins; tie goes to player
    const winnerId =
      damageToOpponent >= damageToPlayer ? s.player.id : s.opponent.id;
    s = { ...s, winner: winnerId };
    events.push({ type: 'GAME_OVER', winnerId });
  } else if (pDead) {
    s = { ...s, winner: s.opponent.id };
    events.push({ type: 'GAME_OVER', winnerId: s.opponent.id });
  } else if (oDead) {
    s = { ...s, winner: s.player.id };
    events.push({ type: 'GAME_OVER', winnerId: s.player.id });
  }

  // Log combat
  s = {
    ...s,
    log: [
      ...s.log,
      log(
        state,
        s.player.id,
        'COMBAT',
        `P: ${playerAtk} ATK vs ${opponentDef} DEF → ${damageToOpponent} dmg | O: ${opponentAtk} ATK vs ${playerDef} DEF → ${damageToPlayer} dmg`,
      ),
    ],
  };

  return s;
}

/** Start a new turn — reset selections, players draw manually */
function startNextTurn(state: GameState, events: GameEvent[]): GameState {
  const newTurn = state.turn + 1;

  // Reset selections; players must draw manually via DRAW_CARD action
  let player = {
    ...state.player,
    selection: emptySelection(),
    hasDrawnThisTurn: false,
  };
  let opponent = {
    ...state.opponent,
    selection: emptySelection(),
    hasDrawnThisTurn: false,
  };

  // Discard temporary arsenals equipped for this turn
  if (player.activeArsenal) {
    events.push({
      type: 'ARSENAL_DROPPED',
      playerId: player.id,
      arsenal: player.activeArsenal,
    });
    player = {
      ...player,
      discard: [...player.discard, player.activeArsenal],
      activeArsenal: null,
    };
  }
  if (opponent.activeArsenal) {
    events.push({
      type: 'ARSENAL_DROPPED',
      playerId: opponent.id,
      arsenal: opponent.activeArsenal,
    });
    opponent = {
      ...opponent,
      discard: [...opponent.discard, opponent.activeArsenal],
      activeArsenal: null,
    };
  }

  // Revert temporary combos — restore original character, discard combo card
  if (player.preComboCharacter) {
    const comboCard = player.active;
    events.push({
      type: 'COMBO_REVERTED',
      playerId: player.id,
      comboCard: comboCard!,
      originalCharacter: player.preComboCharacter,
    });
    player = {
      ...player,
      active: player.preComboCharacter,
      discard: comboCard ? [...player.discard, comboCard] : player.discard,
      preComboCharacter: null,
    };
  }
  if (opponent.preComboCharacter) {
    const comboCard = opponent.active;
    events.push({
      type: 'COMBO_REVERTED',
      playerId: opponent.id,
      comboCard: comboCard!,
      originalCharacter: opponent.preComboCharacter,
    });
    opponent = {
      ...opponent,
      active: opponent.preComboCharacter,
      discard: comboCard ? [...opponent.discard, comboCard] : opponent.discard,
      preComboCharacter: null,
    };
  }

  events.push(
    { type: 'TURN_STARTED', turn: newTurn },
    { type: 'PHASE_CHANGED', phase: 'select' },
  );

  return {
    ...state,
    turn: newTurn,
    phase: 'select',
    player,
    opponent,
    isFirstTurn: false,
    log: [
      ...state.log,
      log(state, state.player.id, 'NEW_TURN', `Turn ${newTurn}`),
    ],
  };
}
