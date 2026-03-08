/* ═══════════════════════════════════════════════════════════════════════════
 *  Legacy Base Set — Tricks
 * ═══════════════════════════════════════════════════════════════════════════ */

import { TrickCard } from '../../base';

const SET = 'legacy-base';

export const DubiousPotion = new TrickCard({
  name: 'Dubious Potion',
  description: 'Tastes like feet, heals like magic.',
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/potion.webp',
  attack: 0,
  defense: 0,
  cost: 1,
  effects: [
    {
      id: 'heal-3',
      trigger: 'on-play',
      description: 'Before Combat: Restore 3 HP.',
      handler: 'heal_owner',
      params: { amount: 3 },
      timing: 'before-combat',
    },
  ],
  set: SET,
});

export const SalvageRune = new TrickCard({
  name: 'Salvage Rune',
  description: 'A glowing rune that yanks your weapon back before it breaks.',
  rarity: 'nice',
  tier: 'base',
  imageUrl: '/cards/tutorial/salvage-rune.webp',
  attack: 0,
  defense: 0,
  cost: 2,
  effects: [
    {
      id: 'recover-arsenal',
      trigger: 'on-play',
      description: 'After Combat: Return arsenal to hand.',
      handler: 'recover_arsenal',
      timing: 'after-combat',
    },
  ],
  set: SET,
});

export const RudeGesture = new TrickCard({
  name: 'Rude Gesture',
  description:
    'The opponent makes a very rude gesture. It hurts your feelings and your HP.',
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/taunt.webp',
  attack: 0,
  defense: 0,
  cost: 1,
  effects: [
    {
      id: 'taunt-dmg',
      trigger: 'on-play',
      description: 'Before Combat: Deal 2 direct damage.',
      handler: 'damage_opponent',
      params: { amount: 2 },
      timing: 'before-combat',
    },
  ],
  set: SET,
});

export const allTricks = [DubiousPotion, SalvageRune, RudeGesture];
