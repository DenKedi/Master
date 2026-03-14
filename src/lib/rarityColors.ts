/**
 * Single source of truth for rarity → color mapping.
 * Import this everywhere instead of redeclaring per-file.
 */
export const RARITY_COLORS: Record<string, string> = {
  normal: "#9ca3af",
  nice: "#60a5fa",
  special: "#f87171",
  uiiiii: "#4ade80",
  unknown: "#a855f7",
};
