import { defineCard } from '@/lib/cards/define';

export default defineCard({
  id: 'captain-brave',
  type: 'character',
  characterType: 'goblin',
  effects: [],
  combo: [
    {
      characterId: 'goblin-chief',
      arsenalId: 'dented-buckler',
      bonus: { attack: 1, defense: 4 },
    },
  ],
});
