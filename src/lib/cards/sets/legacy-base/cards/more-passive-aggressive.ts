import { defineCard } from '@/lib/cards/define';

export default defineCard({
  id: 'more-passive-aggressive',
  type: 'character',
  characterType: 'goblin',
  effects: [],
  combo: [
    {
      characterId: 'captain-brave',
      arsenalId: 'dented-buckler',
      bonus: { attack: 1, defense: 4 },
    },
  ],
});
