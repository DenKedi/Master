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

// ── Player goblin characters ────────────────────────────────────────────

export const GoblinBrawler = new CharacterCard({
  name: 'Goblin Brawler',
  description: 'Short, fierce, and always looking for trouble.',
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/goblin-brawler.webp',
  attack: 5,
  defense: 3,
  cost: 1,
  characterType: 'goblin',
  set: SET,
});

export const GoblinShaman = new CharacterCard({
  name: 'Goblin Shaman',
  description: 'Surprisingly wise. Mostly talks to mushrooms, though.',
  rarity: 'nice',
  tier: 'base',
  imageUrl: '/cards/tutorial/goblin-shaman.webp',
  attack: 5,
  defense: 5,
  cost: 2,
  characterType: 'goblin',
  set: SET,
});

export const GoblinChief = new CharacterCard({
  name: 'Goblin Chief',
  description: 'Commands with aggression and questionable strategy.',
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/goblin-chief.webp',
  attack: 7,
  defense: 2,
  cost: 2,
  characterType: 'goblin',
  set: SET,
});

// ── Opponent monster characters ─────────────────────────────────────────

export const TrollBrute = new CharacterCard({
  name: 'Troll Brute',
  description: 'Hits first, thinks never.',
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/troll.webp',
  attack: 6,
  defense: 4,
  cost: 1,
  characterType: 'beast',
  set: SET,
});

export const OgreWarrior = new CharacterCard({
  name: 'Ogre Warrior',
  description: 'Towering and merciless. Also surprisingly fast.',
  rarity: 'nice',
  tier: 'base',
  imageUrl: '/cards/tutorial/ogre.webp',
  attack: 7,
  defense: 3,
  cost: 2,
  characterType: 'beast',
  set: SET,
});

export const CaveBear = new CharacterCard({
  name: 'Cave Bear',
  description: 'Ancient predator of dark tunnels. Does not negotiate.',
  rarity: 'nice',
  tier: 'base',
  imageUrl: '/cards/tutorial/cave-bear.webp',
  attack: 7,
  defense: 6,
  cost: 2,
  characterType: 'beast',
  set: SET,
});

export const RegularSpider = new CharacterCard({
  name: 'Regular Spider',
  description: 'Eight legs, eight problems. Currently small. Currently.',
  rarity: 'normal',
  tier: 'base',
  imageUrl: '/cards/tutorial/regular-spider.webp',
  attack: 3,
  defense: 2,
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
  GoblinBrawler,
  GoblinShaman,
  GoblinChief,
  TrollBrute,
  OgreWarrior,
  CaveBear,
  RegularSpider,
];
