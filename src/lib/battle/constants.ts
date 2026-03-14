/* ═══════════════════════════════════════════════════════════════════════════
 *  Battle Engine — Constants
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Starting hit points for each player */
export const STARTING_HP = 20;

/** Minimum deck size */
export const MIN_DECK_SIZE = 10;

/** Maximum deck size */
export const MAX_DECK_SIZE = 20;

/** Cards dealt at the start of the game */
export const STARTING_HAND_SIZE = 5;

/** Cards drawn per turn (both players draw simultaneously) */
export const DRAW_PER_TURN = 1;

/** Minimum damage from an attack (attack - defense, but never negative) */
export const MIN_DAMAGE = 0;

/** XP reward for completing the tutorial */
export const TUTORIAL_XP_REWARD = 50;

/** XP reward for winning a PvE battle */
export const PVE_WIN_XP = 25;

/** XP reward for losing a PvE battle (consolation) */
export const PVE_LOSS_XP = 0;

/** Maximum hand size — excess cards are discarded */
export const MAX_HAND_SIZE = 8;
