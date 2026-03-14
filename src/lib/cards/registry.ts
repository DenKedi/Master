/* ═══════════════════════════════════════════════════════════════════════════
 *  Card Registry
 *  Central collection of every card definition in the game.
 *  Set index files register their cards at import-time.
 *
 *  Usage:
 *    import '@/lib/cards/sets/legacy-base';       // registers cards
 *    import { registry } from '@/lib/cards';      // access them
 *    const def = registry.get('goblin-bungler');  // by card id
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { CardDefinition, CardComboRecipe } from './define';
import type { SetDefinition } from './set';
import type { BattleComboRecipe } from '../battle/types';

/** Recipe stored internally — includes the result card id */
export interface RegistryComboRecipe extends CardComboRecipe {
  resultId: string;
}

class CardRegistry {
  private cards = new Map<string, CardDefinition>();
  private sets = new Map<string, SetDefinition>();
  private recipes: RegistryComboRecipe[] = [];

  /** Register an entire set (cards + combo recipes extracted automatically). */
  registerSet(set: SetDefinition): void {
    this.sets.set(set.id, set);
    for (const card of set.cards) {
      this.register(card);
      // Auto-extract combo recipes from cards that define them
      if (card.combo) {
        for (const recipe of card.combo) {
          this.recipes.push({ ...recipe, resultId: card.id });
        }
      }
    }
  }

  /** Register a single card definition. Keyed by id. */
  register(card: CardDefinition): void {
    if (this.cards.has(card.id)) {
      throw new Error(`Duplicate card registration: "${card.id}"`);
    }
    this.cards.set(card.id, card);
  }

  /** Look up a card definition by id. */
  get(id: string): CardDefinition | undefined {
    return this.cards.get(id);
  }

  /** Get all registered card definitions. */
  getAll(): CardDefinition[] {
    return Array.from(this.cards.values());
  }

  /** Get all cards belonging to a specific set. */
  getBySet(setId: string): CardDefinition[] {
    const set = this.sets.get(setId);
    return set ? set.cards : [];
  }

  /** Get a set definition (for pullRates etc.). */
  getSet(setId: string): SetDefinition | undefined {
    return this.sets.get(setId);
  }

  /** Get all registered set definitions. */
  getAllSets(): SetDefinition[] {
    return Array.from(this.sets.values());
  }

  /** Get all combo recipes extracted from card definitions. */
  getRecipes(): RegistryComboRecipe[] {
    return [...this.recipes];
  }

  /** Clear all registered cards, sets, and recipes (for cache reload). */
  clear(): void {
    this.cards.clear();
    this.sets.clear();
    this.recipes = [];
  }

  /** Number of registered cards. */
  get size(): number {
    return this.cards.size;
  }
}

/** Singleton registry — import and use from anywhere. */
export const registry = new CardRegistry();
