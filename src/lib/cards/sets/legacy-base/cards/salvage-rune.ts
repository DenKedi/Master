import { defineCard } from '@/lib/cards/define';

export default defineCard({
  id: 'salvage-rune',
  type: 'trick',
  effects: [
    {
      id: 'recover-arsenal',
      trigger: 'on-play',
      description: 'After Combat: Return arsenal to hand.',
      handler: 'recover_arsenal',
      timing: 'after-combat',
    },
  ],
});
