import { defineCard } from '@/lib/cards/define';

export default defineCard({
  id: 'infernal-zonk',
  type: 'character',
  characterType: 'beast',
  effects: [
    {
      id: 'infernal-zonk-combo',
      trigger: 'on-combo',
      description: 'Combo: unleash +3 Attack from pure infernal rage.',
      handler: 'combo_bonus_attack',
      params: { amount: 3 },
    },
  ],
  combo: [
    {
      characterId: 'zonk',
      arsenalId: 'genetically-privileged',
      bonus: { attack: 0, defense: 0 },
    },
  ],
});
