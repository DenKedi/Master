/* ═══════════════════════════════════════════════════════════════════════════
 *  Battle Engine — AI
 *  Picks actions for the AI player in the simultaneous turn system.
 *  The AI submits its full selection and confirms immediately.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { GameState, GameAction, BattleCard, PlayerState } from './types';
import { findComboRecipe, getAvailableCombos } from './engine';

export type AIDifficulty = 'tutorial' | 'easy' | 'medium' | 'hard';

export interface BestComboSelection {
  /** Arsenal card uid to pass to SELECT_COMBO */
  arsenalUid: string;
  /** Character uid to SELECT_CHARACTER first, or null if the active card is used */
  characterUid: string | null;
  /** The trick in hand that provides the greatest stat boost, or null */
  trickUid: string | null;
  /** Estimated total power (atk + def) including any trick boost */
  estimatedPower: number;
}

/**
 * Evaluates every (character × arsenal) pair the AI can form — from both its
 * hand and its currently active card — and returns the combination with the
 * highest total power (attack + defense).  Optionally pairs the result with
 * the single trick in hand that provides the greatest stat boost via
 * boost_attack / boost_defense on-play effects.
 *
 * Returns null when no valid combo recipe exists.
 * Does NOT consider difficulty — the caller decides whether to use the result.
 */
export function getBestComboSelection(
  state: GameState,
  aiPlayerId: string,
): BestComboSelection | null {
  const ai = state.player.id === aiPlayerId ? state.player : state.opponent;

  // Candidate characters: active card (if any) + hand characters
  const candidateChars: Array<{ card: BattleCard; fromHand: boolean }> = [];
  if (ai.active) candidateChars.push({ card: ai.active, fromHand: false });
  ai.hand
    .filter(c => c.type === 'character')
    .forEach(c => candidateChars.push({ card: c, fromHand: true }));

  const arsenals = ai.hand.filter(c => c.type === 'arsenal');
  if (candidateChars.length === 0 || arsenals.length === 0) return null;

  // Find the single trick in hand with the highest stat boost
  let bestTrick: { uid: string; boost: number } | null = null;
  for (const trick of ai.hand.filter(c => c.type === 'trick')) {
    const boost = estimateTrickBoost(trick);
    if (boost > 0 && (bestTrick === null || boost > bestTrick.boost)) {
      bestTrick = { uid: trick.uid, boost };
    }
  }
  const trickBoost = bestTrick?.boost ?? 0;

  // Evaluate every character × arsenal pair
  let best: BestComboSelection | null = null;
  for (const { card: charCard, fromHand } of candidateChars) {
    for (const arsenal of arsenals) {
      const recipe = findComboRecipe(
        state.comboRecipes,
        charCard.name,
        arsenal.name,
      );
      if (!recipe) continue;

      const comboPower =
        recipe.result.attack +
        (recipe.bonus?.attack ?? 0) +
        recipe.result.defense +
        (recipe.bonus?.defense ?? 0);
      const estimatedPower = comboPower + trickBoost;

      if (best === null || estimatedPower > best.estimatedPower) {
        best = {
          arsenalUid: arsenal.uid,
          characterUid: fromHand ? charCard.uid : null,
          trickUid: bestTrick?.uid ?? null,
          estimatedPower,
        };
      }
    }
  }

  return best;
}

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

  // 0. Draw a card if we haven't yet this turn (skip if deck empty)
  if (!ai.hasDrawnThisTurn && ai.deck.length > 0) {
    return { type: 'DRAW_CARD' };
  }

  // Pre-compute the optimal combo for non-tutorial difficulties
  const optimalCombo =
    difficulty !== 'tutorial' ? getBestComboSelection(state, aiPlayerId) : null;

  // Step through selection priorities:
  // 1. Select a character if no active and no character selected yet
  if (!ai.active && !ai.selection.characterUid) {
    const chars = ai.hand.filter(c => c.type === 'character');
    if (chars.length > 0) {
      const pick =
        difficulty === 'tutorial'
          ? chars[0]
          : optimalCombo?.characterUid
            ? (chars.find(c => c.uid === optimalCombo.characterUid) ??
               pickBestCharacter(chars, difficulty))
            : pickBestCharacter(chars, difficulty);
      return { type: 'SELECT_CHARACTER', cardUid: pick.uid };
    }
  }

  // 2. Try to select a combo (or equip arsenal) if we haven't yet
  if (!ai.selection.comboArsenalUid && !ai.selection.arsenalConfirmed) {
    if (difficulty !== 'tutorial' && optimalCombo) {
      // Stage the required character first if it differs from what is currently active/selected
      if (
        optimalCombo.characterUid &&
        ai.selection.characterUid !== optimalCombo.characterUid
      ) {
        return { type: 'SELECT_CHARACTER', cardUid: optimalCombo.characterUid };
      }
      return { type: 'SELECT_COMBO', arsenalUid: optimalCombo.arsenalUid };
    }
    // Tutorial: always combo if available
    if (difficulty === 'tutorial') {
      const combos = getAvailableCombos(state, aiPlayerId);
      if (combos.length > 0) {
        return { type: 'SELECT_COMBO', arsenalUid: combos[0].arsenalUid };
      }
    }
    // Non-tutorial fallback: equip any arsenal as a one-turn stat boost
    // when no combo recipe is available
    if (difficulty !== 'tutorial' && !optimalCombo) {
      const arsenals = ai.hand.filter(c => c.type === 'arsenal');
      if (arsenals.length > 0) {
        return { type: 'SELECT_COMBO', arsenalUid: arsenals[0].uid };
      }
    }
  }

  // 2.25. Confirm arsenal use if we've staged one but haven't confirmed yet
  if (ai.selection.comboArsenalUid && !ai.selection.arsenalConfirmed) {
    return { type: 'CONFIRM_ARSENAL' };
  }

  // 2.5. Play the trick that provides the best stat boost for this combo (non-tutorial)
  if (
    difficulty !== 'tutorial' &&
    optimalCombo?.trickUid != null &&
    !ai.selection.trickUids.includes(optimalCombo.trickUid)
  ) {
    return { type: 'PLAY_TRICK', cardUid: optimalCombo.trickUid };
  }

  // 3. Play a random trick (non-tutorial); skip the boost trick already handled above
  if (difficulty !== 'tutorial' && ai.selection.trickUids.length === 0) {
    const tricks = ai.hand.filter(
      c => c.type === 'trick' && c.uid !== optimalCombo?.trickUid,
    );
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

// ─── Card selection helpers ─────────────────────────────────────────────────

/** Sum the stat boost provided by boost_attack / boost_defense on-play effects on a trick card */
function estimateTrickBoost(trick: BattleCard): number {
  return trick.effects
    .filter(
      e =>
        e.trigger === 'on-play' &&
        (e.handler === 'boost_attack' || e.handler === 'boost_defense'),
    )
    .reduce(
      (sum, e) => sum + (typeof e.params?.amount === 'number' ? e.params.amount : 0),
      0,
    );
}

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
