/* ═══════════════════════════════════════════════════════════════════════════
 *  Combo Discovery — tracks which combos the player has seen.
 *  Uses localStorage so discovered combos persist across sessions.
 *  Eventually this could be backed by a server-side "wiki" collection.
 * ═══════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'master_discovered_combos';

function comboKey(characterName: string, arsenalName: string): string {
  return `${characterName.toLowerCase()}::${arsenalName.toLowerCase()}`;
}

/** Get the full set of combo keys the player has discovered */
export function getDiscoveredCombos(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

/** Mark a combo as discovered (call when a combo actually resolves in play) */
export function markComboDiscovered(
  characterName: string,
  arsenalName: string,
): void {
  const key = comboKey(characterName, arsenalName);
  const discovered = getDiscoveredCombos();
  if (discovered.has(key)) return;
  discovered.add(key);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...discovered]));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

/** Check if a specific combo has been discovered */
export function isComboDiscovered(
  characterName: string,
  arsenalName: string,
): boolean {
  return getDiscoveredCombos().has(comboKey(characterName, arsenalName));
}
