import { defineCard } from '@/lib/cards/define';

export default defineCard({
  id: 'giant-spider',
  type: 'character',
  characterType: 'beast',
  effects: [],
  combo: [
    {
      characterId: 'regular-spider',
      arsenalId: 'genetically-privileged',
      bonus: { attack: 0, defense: 0 },
    },
  ],
});
