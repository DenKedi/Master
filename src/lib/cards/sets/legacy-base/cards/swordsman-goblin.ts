import { defineCard } from '@/lib/cards/define';

export default defineCard({
  id: 'swordsman-goblin',
  type: 'character',
  characterType: 'goblin',
  effects: [],
  combo: [
    {
      characterId: 'goblin-bungler',
      arsenalId: 'dead-mates-sword',
      bonus: { attack: 3, defense: 1 },
    },
  ],
});
