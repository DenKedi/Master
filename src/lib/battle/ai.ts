/* ═══════════════════════════════════════════════════════════════════════════
 *  Battle Engine — AI
 *  Picks actions for the AI player in the simultaneous turn system.
 *  The AI submits its full selection and confirms immediately.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { GameState, GameAction, BattleCard, PlayerState } from './types';
import { findComboRecipe, getAvailableCombos } from './engine';

export type AIDifficulty = 'tutorial' | 'easy' | 'medium' | 'hard';

/**
 * Get a sequence of actions the AI should take this turn.
 * In the simultaneous system, the AI stages all selections then confirms.
 * Returns actions one at a time (caller should apply each before calling again).
 */
export function getAIAction(
  state: GameState,
  aiPlayerId: string,
  difficulty: AIDifficulty = 'tutorial',
): GameAction | null {
  const isPlayer = state.player.id === aiPlayerId;
  const ai = isPlayer ? state.player : state.opponent;

  // Only act during select phase
  if (state.phase !== 'select') return null;
  if (state.winner) return null;

  // Already confirmed — nothing to do
  if (ai.selection.confirmed) return null;

  // 0. Draw a card if we haven't yet this turn
  if (!ai.hasDrawnThisTurn && ai.deck.length > 0) {
    return { type: 'DRAW_CARD' };
  }

  // Step through selection priorities:
  // 1. Select a character if no active and no character selected yet
  if (!ai.active && !ai.selection.characterUid) {
    const chars = ai.hand.filter(c => c.type === 'character');
    if (chars.length > 0) {
      const pick =
        difficulty === 'tutorial'
          ? chars[0]
          : pickBestCharacter(chars, difficulty);
      return { type: 'SELECT_CHARACTER', cardUid: pick.uid };
    }
  }

  // 2. Try to select a combo if we haven't yet
  if (!ai.selection.comboArsenalUid) {
    const combos = getAvailableCombos(state, aiPlayerId);
    if (combos.length > 0 && difficulty !== 'tutorial') {
      // Pick the best combo (highest combined stats on result)
      const best = combos.reduce((a, b) =>
        b.result.attack + b.result.defense > a.result.attack + a.result.defense
          ? b
          : a,
      );
      return { type: 'SELECT_COMBO', arsenalUid: best.arsenalUid };
    }
    // Tutorial: always combo if available (to demonstrate the mechanic after first turn)
    if (combos.length > 0 && difficulty === 'tutorial' && state.turn > 1) {
      return { type: 'SELECT_COMBO', arsenalUid: combos[0].arsenalUid };
    }
  }

  // 3. Play a trick (non-tutorial)
  if (difficulty !== 'tutorial' && ai.selection.trickUids.length === 0) {
    const tricks = ai.hand.filter(c => c.type === 'trick');
    if (tricks.length > 0 && Math.random() > 0.4) {
      return { type: 'PLAY_TRICK', cardUid: tricks[0].uid };
    }
  }

  // 4. Play a destination (non-tutorial)
  if (!ai.selection.destinationUid && difficulty !== 'tutorial') {
    const dests = ai.hand.filter(c => c.type === 'destination');
    if (dests.length > 0) {
      return { type: 'PLAY_DESTINATION', cardUid: dests[0].uid };
    }
  }

  // 5. Swap to a better character if we have one and no combo selected
  if (
    ai.active &&
    !ai.selection.characterUid &&
    !ai.selection.comboArsenalUid
  ) {
    const chars = ai.hand.filter(c => c.type === 'character');
    if (chars.length > 0 && difficulty !== 'tutorial') {
      const best = pickBestCharacter(chars, difficulty);
      if (best.attack + best.defense > ai.active.attack + ai.active.defense) {
        return { type: 'SELECT_CHARACTER', cardUid: best.uid };
      }
    }
  }

  // 6. Confirm
  const willHaveActive = ai.selection.characterUid || ai.active;
  if (willHaveActive) {
    return { type: 'CONFIRM_SELECTION' };
  }

  // Nothing to do (unlikely but safe)
  return { type: 'CONFIRM_SELECTION' };
}

// ─── Card selection helpers ────────────────────────────────────────────────

function pickBestCharacter(
  chars: BattleCard[],
  difficulty: AIDifficulty,
): BattleCard {
  if (difficulty === 'easy') {
    // Pick worst character
    return chars.reduce((worst, c) =>
      c.attack + c.defense < worst.attack + worst.defense ? c : worst,
    );
  }
  // Medium/Hard: pick highest combined stats
  return chars.reduce((best, c) =>
    c.attack + c.defense > best.attack + best.defense ? c : best,
  );
}
