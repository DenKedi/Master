export interface Rank {
  title: string;
  description: string;
  /** Minimum XP (0–1000) required to hold this rank */
  minXp: number;
  /** Rough top-% flavour label shown in UI */
  flavor: string;
  color: string;
}

/**
 * Ranks ordered from LOWEST (index 0) to HIGHEST (last index).
 * minXp ranges map to the percentage tiers in the design doc.
 */
export const RANKS: Rank[] = [
  {
    title: 'Trap Tester',
    description: 'Always go first.',
    flavor: '0.01%',
    minXp: 0,
    color: 'rgba(120,80,60,0.9)',
  },
  {
    title: 'Professional Scapegoat',
    description: 'Or blame it on the dog.',
    flavor: '5%',
    minXp: 50,
    color: 'rgba(140,90,60,0.9)',
  },
  {
    title: 'Liar-in-Training',
    description:
      'Crafting excuses that don\'t involve the phrase "It wasn\'t me."',
    flavor: '15%',
    minXp: 150,
    color: 'rgba(160,120,50,0.9)',
  },
  {
    title: 'Dungeon Dust-Bunny',
    description: 'What do you mean, "Explosive Runes."',
    flavor: '30%',
    minXp: 300,
    color: 'rgba(80,140,180,0.9)',
  },
  {
    title: 'Master of Misdirection',
    description:
      'When you blame it on others, they will statistically believe you more than the others.',
    flavor: '45%',
    minXp: 450,
    color: 'rgba(100,160,80,0.9)',
  },
  {
    title: 'Sycophant Second Class',
    description: 'Perfecting the art of the "Flattering Cower."',
    flavor: '55%',
    minXp: 550,
    color: 'rgba(180,140,40,0.9)',
  },
  {
    title: 'Chief Architect of Catastrophe',
    description: 'Leading the failed missions that start the game.',
    flavor: '75%',
    minXp: 750,
    color: 'rgba(200,100,40,0.9)',
  },
  {
    title: 'High Vizier of Vague Excuses',
    description: 'Managing the "Book of Blame" for the entire tower.',
    flavor: '85%',
    minXp: 850,
    color: 'rgba(180,80,220,0.9)',
  },
  {
    title: "The Dark Lord's Footrest",
    description:
      'The highest honor. You are physically safe, but your back hurts.',
    flavor: 'Top',
    minXp: 950,
    color: 'rgba(200,150,42,1)',
  },
];

/** Returns the current rank for a given XP value. */
export function getRank(xp: number): Rank {
  // Walk from highest to lowest and return the first one the user qualifies for
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXp) return RANKS[i];
  }
  return RANKS[0];
}

/** Returns 0–100 progress % towards the next rank. */
export function getRankProgress(xp: number): {
  rank: Rank;
  next: Rank | null;
  pct: number;
} {
  const rank = getRank(xp);
  const idx = RANKS.indexOf(rank);
  const next = idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
  const pct = next
    ? Math.min(
        100,
        Math.round(((xp - rank.minXp) / (next.minXp - rank.minXp)) * 100),
      )
    : 100;
  return { rank, next, pct };
}
