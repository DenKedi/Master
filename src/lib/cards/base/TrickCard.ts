/* ═══════════════════════════════════════════════════════════════════════════
 *  TrickCard — One-shot spells / abilities with before- or after-combat timing.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { Card, type CardConfig } from './Card';

export type TrickCardConfig = Omit<CardConfig, 'type'>;

export class TrickCard extends Card {
  constructor(config: TrickCardConfig) {
    super({ ...config, type: 'trick' });
  }
}
