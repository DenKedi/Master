import { defineCard } from '@/lib/cards/define';

export default defineCard({
  id: 'fortified-goblin',
  type: 'character',
  characterType: 'goblin',
  effects: [],
  combo: [
    {
      characterId: 'goblin-bungler',
      arsenalId: 'goblin-shield',
      bonus: { attack: 0, defense: 3 },
    },
    {
      characterId: 'goblin-chief',
      arsenalId: 'goblin-shield',
      bonus: { attack: 0, defense: 3 },
    },
  ],
});
