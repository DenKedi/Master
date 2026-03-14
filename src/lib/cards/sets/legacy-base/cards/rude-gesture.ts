import { defineCard } from '@/lib/cards/define';

export default defineCard({
  id: 'rude-gesture',
  type: 'trick',
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
});
