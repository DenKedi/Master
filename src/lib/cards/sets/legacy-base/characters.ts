/* ═══════════════════════════════════════════════════════════════════════════
 *  Legacy Base Set — Characters
 *  Player & opponent character cards from the tutorial / starter set.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { CharacterCard } from '../../base';

const SET = 'legacy-base';

// ── Player characters ───────────────────────────────────────────────────

export const BumblingSquire = new CharacterCard({
  name: 'Bumbling Squire',
  description: 'Eager but clumsy. Always trips on his own cape.',
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/squire.webp',
  attack: 5,
  defense: 3,
  cost: 1,
  characterType: 'human',
  set: SET,
});

export const RustyKnight = new CharacterCard({
  name: 'Rusty Knight',
  description: 'His armor squeaks louder than his battle cry.',
  rarity: 'nice',
  tier: 'base',
  imageUrl: '/cards/tutorial/knight.webp',
  attack: 6,
  defense: 4,
  cost: 2,
  characterType: 'human',
  set: SET,
});

export const SwampWitch = new CharacterCard({
  name: 'Swamp Witch',
  description: 'Smells weird, but has great aim with hexes.',
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/witch.webp',
  attack: 7,
  defense: 2,
  cost: 2,
  characterType: 'human',
  set: SET,
});

// ── Opponent characters ─────────────────────────────────────────────────

export const SnottyGoblin = new CharacterCard({
  name: 'Snotty Goblin',
  description: 'Picks fights and noses with equal enthusiasm.',
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/goblin.webp',
  attack: 3,
  defense: 2,
  cost: 1,
  characterType: 'goblin',
  set: SET,
});

export const ConfusedOrc = new CharacterCard({
  name: 'Confused Orc',
  description: "Not sure why he's here. Hits hard anyway.",
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/orc.webp',
  attack: 4,
  defense: 3,
  cost: 1,
  characterType: 'beast',
  set: SET,
});

export const allCharacters = [
  BumblingSquire,
  RustyKnight,
  SwampWitch,
  SnottyGoblin,
  ConfusedOrc,
];
