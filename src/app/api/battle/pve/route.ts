import { NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth';
import { connectDB } from '@/lib/mongodb';
import CardModel from '@/models/Card';
import type { CardDocument } from '@/models/Card';
import UserModel from '@/models/User';
import DeckModel from '@/models/Deck';
import {
  PVE_PLAYER_DECK,
  PVE_OPPONENT_DECK,
  PVE_COMBOS,
  PVE_OPPONENT_HP,
} from '@/lib/battle/pve';
import { getHpForXp } from '@/lib/ranks';
import { STARTING_HP } from '@/lib/battle/constants';
import type { BattleCard, BattleComboRecipe } from '@/lib/battle/types';

export async function GET() {
  const [session] = await Promise.all([auth(), connectDB()]);

  let playerHp = STARTING_HP;
  let userId: string | null = null;
  if (session?.user) {
    userId = (session.user as any).id;
    const user = await UserModel.findById(userId).select('xp').lean();
    if (user) playerHp = getHpForXp((user as any).xp ?? 0);
  }

  // Try to use the player's active deck; fall back to the default PvE starter deck
  let customPlayerDeck: BattleCard[] | null = null;
  if (userId) {
    const activeDeck = await DeckModel.findOne({ userId, isActive: true })
      .populate<{ cards: CardDocument[] }>('cards')
      .lean();
    if (activeDeck && activeDeck.cards.length > 0) {
      customPlayerDeck = activeDeck.cards.map((card, i) => ({
        uid: `user-deck-${i}`,
        cardId: card.cardId,
        name: card.name,
        description: card.description ?? '',
        type: card.type,
        imageUrl: card.imageUrl ?? '',
        attack: card.attack ?? 0,
        defense: card.defense ?? 0,
        effects: (card.effects as BattleCard['effects']) ?? [],
        rarity: card.rarity ?? 'normal',
        characterType: card.characterType,
      }));
    }
  }

  // Collect every unique cardId we need for opponent deck + combos (+ fallback player deck)
  const fallbackEntries = customPlayerDeck ? [] : PVE_PLAYER_DECK;
  const allIds = [
    ...new Set([
      ...fallbackEntries.map((e) => e.cardId),
      ...PVE_OPPONENT_DECK.map((e) => e.cardId),
      ...PVE_COMBOS.map((e) => e.resultCardId),
      ...PVE_COMBOS.map((e) => e.characterCardId),
      ...PVE_COMBOS.map((e) => e.arsenalCardId),
    ]),
  ];

  const dbCards = await CardModel.find({ cardId: { $in: allIds } }).lean();
  const dbMap = new Map(dbCards.map((c) => [c.cardId, c]));

  // Check all cards exist
  const missing = allIds.filter((id) => !dbMap.has(id));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Cards not found in DB: ${missing.join(', ')}` },
      { status: 500 },
    );
  }

  function toBattleCard(cId: string, uid: string): BattleCard {
    const db = dbMap.get(cId)!;
    return {
      uid,
      cardId: cId,
      name: db.name,
      description: db.description ?? '',
      type: db.type,
      imageUrl: db.imageUrl ?? '',
      attack: db.attack ?? 0,
      defense: db.defense ?? 0,
      effects: db.effects ?? [],
      rarity: db.rarity ?? 'normal',
      characterType: db.characterType,
    };
  }

  const playerDeck = customPlayerDeck ?? PVE_PLAYER_DECK.map((e) => toBattleCard(e.cardId, e.uid));
  const opponentDeck = PVE_OPPONENT_DECK.map((e) => toBattleCard(e.cardId, e.uid));

  const comboRecipes: BattleComboRecipe[] = PVE_COMBOS.map((e) => ({
    characterName: dbMap.get(e.characterCardId)!.name,
    arsenalName: dbMap.get(e.arsenalCardId)!.name,
    result: toBattleCard(e.resultCardId, e.resultUid),
  }));

  return NextResponse.json({ playerDeck, opponentDeck, comboRecipes, playerHp, opponentHp: PVE_OPPONENT_HP });
}
