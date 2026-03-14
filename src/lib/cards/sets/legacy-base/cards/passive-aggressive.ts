import { defineCard } from '@/lib/cards/define';

export default defineCard({
  id: 'passive-aggressive',
  type: 'character',
  characterType: 'goblin',
  effects: [],
  combo: [
    {
      characterId: 'goblin-bungler',
      arsenalId: 'dented-buckler',
      bonus: { attack: 1, defense: 4 },
    },
  ],
});
