import { defineCard } from '@/lib/cards/define';

export default defineCard({
  id: 'goblin-warren',
  type: 'destination',
  effects: [
    {
      id: 'warren-goblin-boost',
      trigger: 'passive',
      description: 'Goblin characters gain +2 Attack.',
      handler: 'boost_attack',
      params: { amount: 2, characterType: 'goblin' },
    },
  ],
});
