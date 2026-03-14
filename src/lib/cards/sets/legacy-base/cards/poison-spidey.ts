import { defineCard } from '@/lib/cards/define';

export default defineCard({
  id: 'poison-spidey',
  type: 'character',
  characterType: 'beast',
  effects: [],
  combo: [
    {
      characterId: 'regular-spider',
      arsenalId: 'toxin',
      bonus: { attack: 0, defense: 0 },
    },
  ],
});
