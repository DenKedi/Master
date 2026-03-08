/* ═══════════════════════════════════════════════════════════════════════════
 *  DestinationCard — Persistent zones with passive or triggered effects.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { Card, type CardConfig } from './Card';

export type DestinationCardConfig = Omit<CardConfig, 'type'>;

export class DestinationCard extends Card {
  constructor(config: DestinationCardConfig) {
    super({ ...config, type: 'destination' });
  }
}
