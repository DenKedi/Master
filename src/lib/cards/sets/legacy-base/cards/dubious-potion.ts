import { defineCard } from '@/lib/cards/define';

export default defineCard({
  id: 'dubious-potion',
  type: 'trick',
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
});
