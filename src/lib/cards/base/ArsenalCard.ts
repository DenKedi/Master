/* ═══════════════════════════════════════════════════════════════════════════
 *  ArsenalCard — Weapons, shields, and equipment.
 *  When combined with a character via a recipe the combo replaces the
 *  active fighter with a stronger card.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { Card, type CardConfig } from './Card';

export type ArsenalCardConfig = Omit<CardConfig, 'type'>;

export class ArsenalCard extends Card {
  constructor(config: ArsenalCardConfig) {
    super({ ...config, type: 'arsenal' });
  }
}
