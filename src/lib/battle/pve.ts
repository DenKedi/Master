/* ═══════════════════════════════════════════════════════════════════════════
 *  PvE Quick Battle — Deck composition & combo structure.
 *  Actual stats / names are fetched from the DB via /api/battle/pve.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Fixed starting HP for the PvE opponent (Spider Queen). */
export const PVE_OPPONENT_HP = 24;

export interface PveDeckEntry {
  cardId: string;
  uid: string;
}

/** Player starter deck — 10 cards */
export const PVE_PLAYER_DECK: PveDeckEntry[] = [
  { cardId: 'goblin-bungler',   uid: 'pve-bungler' },
  { cardId: 'goblin-chief',     uid: 'pve-chief' },
  { cardId: 'dead-mates-sword', uid: 'pve-sword-1' },
  { cardId: 'dead-mates-sword', uid: 'pve-sword-2' },
  { cardId: 'dented-buckler',   uid: 'pve-buckler-1' },
  { cardId: 'dented-buckler',   uid: 'pve-buckler-2' },
  { cardId: 'dubious-potion',   uid: 'pve-heal' },
  { cardId: 'goblin-shield',    uid: 'pve-goblin-shield-1' },
  { cardId: 'goblin-shield',    uid: 'pve-goblin-shield-2' },
  { cardId: 'goblin-warren',    uid: 'pve-warren' },
];

/** Opponent beast deck — 10 cards */
export const PVE_OPPONENT_DECK: PveDeckEntry[] = [
  { cardId: 'regular-spider',         uid: 'pve-spider-1' },
  { cardId: 'regular-spider',         uid: 'pve-spider-2' },
  { cardId: 'genetically-privileged', uid: 'pve-gen-priv-1' },
  { cardId: 'genetically-privileged', uid: 'pve-gen-priv-2' },
  { cardId: 'toxin',                  uid: 'pve-toxin-1' },
  { cardId: 'toxin',                  uid: 'pve-toxin-2' },
  { cardId: 'zonk',                   uid: 'pve-zonk-1' },
  { cardId: 'zonk',                   uid: 'pve-zonk-2' },
  { cardId: 'giant-spider',           uid: 'pve-giant-spider' },
  { cardId: 'poison-spidey',          uid: 'pve-poison-spidey' },
];

export interface PveComboEntry {
  characterCardId: string;
  arsenalCardId: string;
  resultCardId: string;
  resultUid: string;
}

/** Combo recipes — character + arsenal → result */
export const PVE_COMBOS: PveComboEntry[] = [
  // Player combos
  { characterCardId: 'goblin-bungler', arsenalCardId: 'dead-mates-sword', resultCardId: 'swordsman-goblin',   resultUid: 'pve-combo-swordsman' },
  { characterCardId: 'goblin-bungler', arsenalCardId: 'dented-buckler',   resultCardId: 'passive-aggressive', resultUid: 'pve-combo-passive-aggressive' },
  { characterCardId: 'goblin-bungler', arsenalCardId: 'goblin-shield',    resultCardId: 'fortified-goblin',   resultUid: 'pve-combo-fortified' },
  { characterCardId: 'goblin-chief',   arsenalCardId: 'dented-buckler',   resultCardId: 'captain-brave',      resultUid: 'pve-combo-captain-brave' },
  { characterCardId: 'goblin-chief',   arsenalCardId: 'goblin-shield',    resultCardId: 'fortified-goblin',   resultUid: 'pve-combo-fortified-2' },
  // Opponent combos
  { characterCardId: 'regular-spider', arsenalCardId: 'genetically-privileged', resultCardId: 'giant-spider',  resultUid: 'pve-combo-giant-spider' },
  { characterCardId: 'regular-spider', arsenalCardId: 'toxin',                  resultCardId: 'poison-spidey', resultUid: 'pve-combo-poison-spidey' },
];
