/* ═══════════════════════════════════════════════════════════════════════════
 *  Legacy Base Set — Destinations
 * ═══════════════════════════════════════════════════════════════════════════ */

import { DestinationCard } from '../../base';

const SET = 'legacy-base';

export const CrumblingCourtyard = new DestinationCard({
  name: 'Crumbling Courtyard',
  description: 'An ancient training ground. The stones whisper encouragement.',
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/courtyard.webp',
  attack: 0,
  defense: 0,
  cost: 1,
  effects: [
    {
      id: 'courtyard-boost',
      trigger: 'passive',
      description: 'All characters gain +1 Attack while in the Courtyard.',
      handler: 'boost_attack',
      params: { amount: 1 },
    },
  ],
  set: SET,
});

export const GoblinWarren = new DestinationCard({
  name: 'Goblin Warren',
  description: 'A cramped but loyal hideout. Goblins fight fiercer here.',
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/goblin-warren.webp',
  attack: 0,
  defense: 0,
  cost: 1,
  effects: [
    {
      id: 'warren-goblin-boost',
      trigger: 'passive',
      description: 'Goblin characters gain +2 Attack in the Warren.',
      handler: 'boost_attack',
      params: { amount: 2, characterType: 'goblin' },
    },
  ],
  set: SET,
});

export const allDestinations = [CrumblingCourtyard, GoblinWarren];
