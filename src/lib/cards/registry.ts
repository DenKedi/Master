/* ═══════════════════════════════════════════════════════════════════════════
 *  Card Registry
 *  Central collection of every card definition in the game.
 *  Set index files register their cards at import-time.
 *
 *  Usage:
 *    import '@/lib/cards/sets/legacy-base';   // registers cards
 *    import { registry } from '@/lib/cards';  // access them
 *    const squire = registry.get('Bumbling Squire');
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { Card } from './base/Card';
import type { BattleComboRecipe } from '../battle/types';

class CardRegistry {
  private cards = new Map<string, Card>();
  private recipes: BattleComboRecipe[] = [];

  /** Register a card. Keyed by name (case-insensitive). */
  register(card: Card): void {
    const key = card.name.toLowerCase();
    if (this.cards.has(key)) {
      throw new Error(`Duplicate card registration: "${card.name}"`);
    }
    this.cards.set(key, card);
  }

  /** Register multiple cards at once. */
  registerAll(cards: Card[]): void {
    for (const card of cards) {
      this.register(card);
    }
  }

  /** Register combo recipes. */
  registerRecipes(recipes: BattleComboRecipe[]): void {
    this.recipes.push(...recipes);
  }

  /** Look up a card by name (case-insensitive). */
  get(name: string): Card | undefined {
    return this.cards.get(name.toLowerCase());
  }

  /** Get all registered cards. */
  getAll(): Card[] {
    return Array.from(this.cards.values());
  }

  /** Get all cards belonging to a specific set. */
  getBySet(setName: string): Card[] {
    return this.getAll().filter(c => c.set === setName);
  }

  /** Get all registered combo recipes. */
  getRecipes(): BattleComboRecipe[] {
    return [...this.recipes];
  }

  /** Number of registered cards. */
  get size(): number {
    return this.cards.size;
  }
}

/** Singleton registry — import and use from anywhere. */
export const registry = new CardRegistry();
