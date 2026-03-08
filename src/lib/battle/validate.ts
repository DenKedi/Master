/* ═══════════════════════════════════════════════════════════════════════════
 *  Battle Engine — Validation
 *  Checks whether a given action is legal for a player in the current state.
 *  Both players can act simultaneously during the 'select' phase.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { GameState, GameAction } from './types';
import { findComboRecipe } from './engine';

/**
 * Returns true when `action` is legal for the given player.
 * In the simultaneous system, both players submit during 'select' phase.
 */
export function isValidAction(
  state: GameState,
  action: GameAction,
  playerId: string,
): { valid: boolean; reason?: string } {
  // Game already over
  if (state.winner) {
    return { valid: false, reason: 'Game is over.' };
  }

  // Only 'select' phase allows actions
  if (state.phase !== 'select') {
    return {
      valid: false,
      reason: 'Actions can only be submitted during the select phase.',
    };
  }

  const actor = state.player.id === playerId ? state.player : state.opponent;

  // Already confirmed — can only undo
  if (actor.selection.confirmed && action.type !== 'UNDO_SELECTION') {
    return { valid: false, reason: 'Selection already confirmed. Undo first.' };
  }

  switch (action.type) {
    case 'SELECT_CHARACTER': {
      const card = actor.hand.find(c => c.uid === action.cardUid);
      if (!card) return { valid: false, reason: 'Card not in hand.' };
      if (card.type !== 'character')
        return { valid: false, reason: 'Not a character card.' };
      // Can't select a card that's already staged as a trick or destination
      if (actor.selection.trickUids.includes(action.cardUid))
        return { valid: false, reason: 'Card is already staged as a trick.' };
      return { valid: true };
    }

    case 'SELECT_COMBO': {
      const arsenal = actor.hand.find(c => c.uid === action.arsenalUid);
      if (!arsenal) return { valid: false, reason: 'Arsenal not in hand.' };
      if (arsenal.type !== 'arsenal')
        return { valid: false, reason: 'Not an arsenal card.' };

      // Need a character to equip to (selected or active)
      const charForCombo = actor.selection.characterUid
        ? actor.hand.find(c => c.uid === actor.selection.characterUid)
        : actor.active;

      if (!charForCombo)
        return {
          valid: false,
          reason: 'No active character to equip arsenal to.',
        };

      // Recipe not required — if no recipe exists the arsenal is equipped as a
      // one-turn stat boost (activeArsenal), rather than creating a combo card.
      return { valid: true };
    }

    case 'DESELECT_COMBO': {
      if (!actor.selection.comboArsenalUid)
        return { valid: false, reason: 'No combo selected to deselect.' };
      return { valid: true };
    }

    case 'PLAY_TRICK': {
      const card = actor.hand.find(c => c.uid === action.cardUid);
      if (!card) return { valid: false, reason: 'Card not in hand.' };
      if (card.type !== 'trick')
        return { valid: false, reason: 'Not a trick card.' };
      if (actor.selection.trickUids.includes(action.cardUid))
        return { valid: false, reason: 'Trick already staged.' };
      return { valid: true };
    }

    case 'REMOVE_TRICK': {
      if (!actor.selection.trickUids.includes(action.cardUid))
        return { valid: false, reason: 'Trick not staged.' };
      return { valid: true };
    }

    case 'PLAY_DESTINATION': {
      const card = actor.hand.find(c => c.uid === action.cardUid);
      if (!card) return { valid: false, reason: 'Card not in hand.' };
      if (card.type !== 'destination')
        return { valid: false, reason: 'Not a destination card.' };
      return { valid: true };
    }

    case 'REMOVE_DESTINATION': {
      if (!actor.selection.destinationUid)
        return { valid: false, reason: 'No destination staged to remove.' };
      return { valid: true };
    }

    case 'CONFIRM_SELECTION': {
      // Must have drawn a card this turn before confirming
      if (!actor.hasDrawnThisTurn)
        return {
          valid: false,
          reason: 'You must draw a card before attacking.',
        };

      // Must have an active character (existing or selected) to confirm
      const willHaveActive = actor.selection.characterUid || actor.active;
      if (!willHaveActive)
        return {
          valid: false,
          reason: 'Must have an active character to confirm.',
        };
      return { valid: true };
    }

    case 'UNDO_SELECTION': {
      return { valid: true };
    }

    case 'DRAW_CARD': {
      if (actor.hasDrawnThisTurn)
        return { valid: false, reason: 'Already drawn this turn.' };
      if (actor.deck.length === 0)
        return { valid: false, reason: 'Deck is empty.' };
      return { valid: true };
    }

    default:
      return { valid: false, reason: 'Unknown action.' };
  }
}
