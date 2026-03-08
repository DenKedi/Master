/* ═══════════════════════════════════════════════════════════════════════════
 *  Battle Engine — Effects System
 *  Extensible effect resolution. Each handler processes a CardEffect.
 *  Supports on-play, on-combo, on-attack, on-defend, passive, on-discard.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type {
  GameState,
  GameEvent,
  BattleCard,
  CardEffect,
  PlayerState,
} from './types';

// ─── Effect handler signature ──────────────────────────────────────────────

export type EffectHandler = (
  state: GameState,
  card: BattleCard,
  effect: CardEffect,
  ownerId: string,
) => { state: GameState; events: GameEvent[] };

// ─── Registry ──────────────────────────────────────────────────────────────

const effectRegistry = new Map<string, EffectHandler>();

export function registerEffect(name: string, handler: EffectHandler) {
  effectRegistry.set(name, handler);
}

export function resolveEffect(
  state: GameState,
  card: BattleCard,
  effect: CardEffect,
  ownerId: string,
): { state: GameState; events: GameEvent[] } {
  const handler = effectRegistry.get(effect.handler);
  if (!handler) {
    // Unknown effect — log and skip
    return { state, events: [] };
  }
  return handler(state, card, effect, ownerId);
}

/** Resolve all effects of a given trigger for a card */
export function resolveEffects(
  state: GameState,
  card: BattleCard,
  trigger: CardEffect['trigger'],
  ownerId: string,
): { state: GameState; events: GameEvent[] } {
  const allEvents: GameEvent[] = [];
  let currentState = state;

  for (const effect of card.effects) {
    if (effect.trigger !== trigger) continue;
    const result = resolveEffect(currentState, card, effect, ownerId);
    currentState = result.state;
    allEvents.push(
      {
        type: 'EFFECT_TRIGGERED',
        card,
        effect,
        description: effect.description,
      },
      ...result.events,
    );
  }

  return { state: currentState, events: allEvents };
}

// ─── Built-in effects ──────────────────────────────────────────────────────

/** heal_owner — Restores HP to the owning player */
registerEffect('heal_owner', (state, _card, effect, ownerId) => {
  const amount = (effect.params?.amount as number) ?? 0;
  const isPlayer = state.player.id === ownerId;
  const target: PlayerState = isPlayer ? state.player : state.opponent;
  const newHp = Math.min(target.maxHp, target.hp + amount);
  const delta = newHp - target.hp;

  const updated = { ...target, hp: newHp };
  const newState: GameState = isPlayer
    ? { ...state, player: updated }
    : { ...state, opponent: updated };

  return {
    state: newState,
    events:
      delta > 0
        ? [{ type: 'HP_CHANGED', playerId: ownerId, newHp, delta }]
        : [],
  };
});

/** damage_opponent — Deal direct damage to the opponent */
registerEffect('damage_opponent', (state, _card, effect, ownerId) => {
  const amount = (effect.params?.amount as number) ?? 0;
  const isPlayer = state.player.id === ownerId;
  const target: PlayerState = isPlayer ? state.opponent : state.player;
  const newHp = Math.max(0, target.hp - amount);
  const delta = target.hp - newHp;

  const updated = { ...target, hp: newHp };
  let newState: GameState = isPlayer
    ? { ...state, opponent: updated }
    : { ...state, player: updated };

  const events: GameEvent[] =
    delta > 0
      ? [{ type: 'HP_CHANGED', playerId: target.id, newHp, delta: -delta }]
      : [];

  // Check win condition
  if (newHp <= 0) {
    newState = { ...newState, winner: ownerId };
    events.push({ type: 'GAME_OVER', winnerId: ownerId });
  }

  return { state: newState, events };
});

/** boost_attack — Boost attack of the active card (optionally filter by characterType) */
registerEffect('boost_attack', (state, _card, effect, ownerId) => {
  const amount = (effect.params?.amount as number) ?? 0;
  const characterTypeFilter = effect.params?.characterType as string | undefined;
  const isPlayer = state.player.id === ownerId;
  const playerState: PlayerState = isPlayer ? state.player : state.opponent;

  if (!playerState.active) return { state, events: [] };

  // If a characterType filter is set, only boost matching character types
  if (characterTypeFilter && playerState.active.characterType !== characterTypeFilter) {
    return { state, events: [] };
  }

  const boosted = {
    ...playerState.active,
    attack: playerState.active.attack + amount,
  };
  const updated: PlayerState = { ...playerState, active: boosted };
  const newState: GameState = isPlayer
    ? { ...state, player: updated }
    : { ...state, opponent: updated };

  return { state: newState, events: [] };
});

/** boost_defense — Boost defense of the active card */
registerEffect('boost_defense', (state, _card, effect, ownerId) => {
  const amount = (effect.params?.amount as number) ?? 0;
  const isPlayer = state.player.id === ownerId;
  const playerState: PlayerState = isPlayer ? state.player : state.opponent;

  if (!playerState.active) return { state, events: [] };

  const boosted = {
    ...playerState.active,
    defense: playerState.active.defense + amount,
  };
  const updated: PlayerState = { ...playerState, active: boosted };
  const newState: GameState = isPlayer
    ? { ...state, player: updated }
    : { ...state, opponent: updated };

  return { state: newState, events: [] };
});

/** draw_cards — Draw additional cards */
registerEffect('draw_cards', (state, _card, effect, ownerId) => {
  const amount = (effect.params?.amount as number) ?? 1;
  const isPlayer = state.player.id === ownerId;
  const playerState: PlayerState = isPlayer ? state.player : state.opponent;

  const drawn: BattleCard[] = [];
  const newDeck = [...playerState.deck];
  const newHand = [...playerState.hand];

  for (let i = 0; i < amount && newDeck.length > 0; i++) {
    const card = newDeck.pop()!;
    newHand.push(card);
    drawn.push(card);
  }

  const updated: PlayerState = {
    ...playerState,
    deck: newDeck,
    hand: newHand,
  };
  const newState: GameState = isPlayer
    ? { ...state, player: updated }
    : { ...state, opponent: updated };

  return {
    state: newState,
    events: drawn.map(c => ({
      type: 'CARD_DRAWN' as const,
      playerId: ownerId,
      card: c,
    })),
  };
});

/** combo_bonus_attack — Extra attack bonus when a combo is formed */
registerEffect('combo_bonus_attack', (state, _card, effect, ownerId) => {
  const amount = (effect.params?.amount as number) ?? 0;
  const isPlayer = state.player.id === ownerId;
  const playerState: PlayerState = isPlayer ? state.player : state.opponent;

  if (!playerState.active) return { state, events: [] };

  const boosted = {
    ...playerState.active,
    attack: playerState.active.attack + amount,
  };
  const updated: PlayerState = { ...playerState, active: boosted };
  const newState: GameState = isPlayer
    ? { ...state, player: updated }
    : { ...state, opponent: updated };

  return { state: newState, events: [] };
});

/** combo_bonus_defense — Extra defense bonus when a combo is formed */
registerEffect('combo_bonus_defense', (state, _card, effect, ownerId) => {
  const amount = (effect.params?.amount as number) ?? 0;
  const isPlayer = state.player.id === ownerId;
  const playerState: PlayerState = isPlayer ? state.player : state.opponent;

  if (!playerState.active) return { state, events: [] };

  const boosted = {
    ...playerState.active,
    defense: playerState.active.defense + amount,
  };
  const updated: PlayerState = { ...playerState, active: boosted };
  const newState: GameState = isPlayer
    ? { ...state, player: updated }
    : { ...state, opponent: updated };

  return { state: newState, events: [] };
});

/** recover_arsenal — Return the equipped arsenal to the owner's hand instead of discarding */
registerEffect('recover_arsenal', (state, _card, _effect, ownerId) => {
  const isPlayer = state.player.id === ownerId;
  const playerState: PlayerState = isPlayer ? state.player : state.opponent;
  const arsenal = playerState.activeArsenal;

  if (!arsenal) return { state, events: [] };

  const updated: PlayerState = {
    ...playerState,
    activeArsenal: null,
    hand: [...playerState.hand, arsenal],
  };
  const newState: GameState = isPlayer
    ? { ...state, player: updated }
    : { ...state, opponent: updated };

  return {
    state: newState,
    events: [{ type: 'CARD_DRAWN', playerId: ownerId, card: arsenal }],
  };
});
