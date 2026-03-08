/* ═══════════════════════════════════════════════════════════════════════════
 *  Legacy Base Set — Index
 *  Importing this file auto-registers all cards and recipes into the
 *  global card registry.
 *
 *  Usage:
 *    import '@/lib/cards/sets/legacy-base';
 * ═══════════════════════════════════════════════════════════════════════════ */

import { registry } from '../../registry';
import { allCharacters } from './characters';
import { allArsenal } from './arsenal';
import { allDestinations } from './destinations';
import { allTricks } from './tricks';
import { allCombos } from './combos';
import { legacyBaseRecipes } from './recipes';

// Register all cards
registry.registerAll([
  ...allCharacters,
  ...allArsenal,
  ...allDestinations,
  ...allTricks,
  ...allCombos,
]);

// Register combo recipes
registry.registerRecipes(legacyBaseRecipes);

// Re-export for convenience
export { allCharacters } from './characters';
export { allArsenal } from './arsenal';
export { allDestinations } from './destinations';
export { allTricks } from './tricks';
export { allCombos } from './combos';
export { legacyBaseRecipes } from './recipes';
