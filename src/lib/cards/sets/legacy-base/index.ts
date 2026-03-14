/* ═══════════════════════════════════════════════════════════════════════════
 *  Legacy Base Set — Index
 *  Importing this file auto-registers all cards and recipes into the
 *  global card registry.
 *
 *  Usage:
 *    import '@/lib/cards/sets/legacy-base';
 * ═══════════════════════════════════════════════════════════════════════════ */

import { registry } from '../../registry';
import { defineSet } from '../../set';
import * as cards from './cards';

export const legacyBaseSet = defineSet({
  id: 'legacy-base',
  pullRates: {
    normal: 60,
    nice: 25,
    special: 10,
    uiiiii: 4,
    unknown: 1,
  },
  cards: Object.values(cards),
});

// Auto-register on import
registry.registerSet(legacyBaseSet);

/** Clear registry and re-register all legacy-base cards & recipes. */
export function reloadLegacyBase(): void {
  registry.clear();
  registry.registerSet(legacyBaseSet);
}
