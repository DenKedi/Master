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

export const BoneHammer = new ArsenalCard({
  name: 'Bone Hammer',
  description: 'Crafted from monster bones. Heavier than it looks.',
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/bone-hammer.webp',
  attack: 3,
  defense: 2,
  cost: 1,
  set: SET,
});

export const GeneticallyPrivileged = new ArsenalCard({
  name: 'Genetically Privileged',
  description: 'Pure potential in card form. Give it to the right creature and watch it transform.',
  rarity: 'nice',
  tier: 'base',
  imageUrl: '/cards/tutorial/genetically-privileged.webp',
  attack: 0,
  defense: 0,
  cost: 1,
  set: SET,
});

export const GoblinShield = new ArsenalCard({
  name: 'Goblin Shield',
  description: 'A tower shield forged from enchanted obsidian. Said to stop anything. Anything.',
  rarity: 'special',
  tier: 'advanced',
  imageUrl: '/cards/tutorial/goblin-shield.webp',
  attack: 0,
  defense: 3,
  cost: 1,
  set: SET,
});

export const allArsenal = [ChippedBroadsword, DentedBuckler, GnarlyClub, BoneHammer, GeneticallyPrivileged, GoblinShield];
