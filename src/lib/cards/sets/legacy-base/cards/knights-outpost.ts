import { defineCard } from '@/lib/cards/define';

export default defineCard({
  id: 'knights-outpost',
  type: 'destination',
  effects: [
    {
      id: 'outpost-human-attack-boost',
      trigger: 'passive',
      description: 'Human characters gain +1 Attack and +1 Defense at the Outpost.',
      handler: 'boost_attack',
      params: { amount: 1, characterType: 'human' },
    },
    {
      id: 'outpost-human-defense-boost',
      trigger: 'passive',
      description: 'Human characters gain +1 Defense at the Outpost.',
      handler: 'boost_defense',
      params: { amount: 1, characterType: 'human' },
    },
  ],
});
