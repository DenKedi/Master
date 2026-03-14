import { defineCard } from '@/lib/cards/define';

export default defineCard({
  id: 'fear',
  type: 'trick',
  effects: [
    {
      id: 'fear-disarm',
      trigger: 'on-play',
      description: 'Before Combat: Both characters drop their equipped arsenal.',
      handler: 'disarm_both',
      timing: 'before-combat',
    },
  ],
});
