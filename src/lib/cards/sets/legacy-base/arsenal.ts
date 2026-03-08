/* ═══════════════════════════════════════════════════════════════════════════
 *  Legacy Base Set — Arsenal
 * ═══════════════════════════════════════════════════════════════════════════ */

import { ArsenalCard } from '../../base';

const SET = 'legacy-base';

export const ChippedBroadsword = new ArsenalCard({
  name: 'Chipped Broadsword',
  description: "It's seen better days, and so has its owner.",
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/sword.webp',
  attack: 3,
  defense: 1,
  cost: 1,
  set: SET,
});

export const DentedBuckler = new ArsenalCard({
  name: 'Dented Buckler',
  description: 'Blocks attacks. Sometimes. Best used facing forward.',
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/shield.webp',
  attack: 1,
  defense: 4,
  cost: 1,
  set: SET,
});

export const GnarlyClub = new ArsenalCard({
  name: 'Gnarly Club',
  description: 'A stick. A big, angry stick.',
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/club.webp',
  attack: 2,
  defense: 1,
  cost: 1,
  set: SET,
});

export const allArsenal = [ChippedBroadsword, DentedBuckler, GnarlyClub];
