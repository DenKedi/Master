import { defineCard } from '@/lib/cards/define';

export default defineCard({
  id: 'pocket-aces',
  type: 'trick',
  effects: [
    {
      id: 'draw-two-tricks',
      trigger: 'on-play',
      description: 'Instantly: Draw 2 trick cards from your deck.',
      handler: 'draw_cards_by_type',
      params: { amount: 2, cardType: 'trick', typeName: 'trick card' },
      timing: 'before-combat',
    },
  ],
});
