/**
 * Pre-render a card's PNG and upload it to R2 as a static asset.
 * Called whenever a card's visual data changes (image, crop, stats, name, etc.).
 *
 * R2 key: `renders/{cardId}.png`
 * The render route redirects to this URL when no stat overrides are requested.
 */

import connectDB from "@/lib/mongodb";
import CardModel from "@/models/Card";
import { registry } from "@/lib/cards/registry";
import "@/lib/cards/sets/legacy-base";
import { renderCardPng } from "./renderCard";
import { uploadToR2, deleteFromR2, r2KeyFromUrl } from "@/lib/r2";
import type { CardRenderData } from "./CardTemplate";

/**
 * Pre-render a single card and upload the PNG to R2.
 * Updates the card's `renderUrl` field in the database.
 * @returns The public R2 URL of the rendered PNG, or null on failure.
 */
export async function preRenderCard(cardId: string): Promise<string | null> {
  await connectDB();

  const card = await CardModel.findOne({ cardId }).lean();
  if (!card) return null;

  const def = registry.get(cardId);

  const renderData: CardRenderData = {
    cardId: card.cardId,
    name: card.name,
    description: card.description,
    type: card.type as CardRenderData["type"],
    imageUrl: card.imageUrl,
    attack: card.attack,
    defense: card.defense,
    rarity: card.rarity,
    characterType: def?.characterType ?? (card as any).characterType,
    effects: (card.effects ?? []).map((e: any) => ({ description: e.description })),
  };

  const png = await renderCardPng(renderData);

  // Upload to R2 — use a timestamp suffix to bust CDN cache
  const key = `renders/${cardId}-${Date.now()}.png`;
  const publicUrl = await uploadToR2(key, png, "image/png");

  // Delete previous render if it exists
  const existing = await CardModel.findOne({ cardId }).select("renderUrl").lean();
  if (existing?.renderUrl) {
    const oldKey = r2KeyFromUrl(existing.renderUrl);
    if (oldKey) {
      try { await deleteFromR2(oldKey); } catch { /* non-fatal */ }
    }
  }

  // Store the new render URL
  await CardModel.updateOne({ cardId }, { $set: { renderUrl: publicUrl } });

  return publicUrl;
}

/**
 * Pre-render ALL active cards. Used for initial migration or bulk refresh.
 * Returns count of successfully rendered cards.
 */
export async function preRenderAllCards(): Promise<{ success: number; failed: string[] }> {
  await connectDB();

  const cards = await CardModel.find({ isActive: true }).select("cardId").lean();
  let success = 0;
  const failed: string[] = [];

  // Process sequentially to avoid overwhelming the server
  for (const card of cards) {
    try {
      await preRenderCard(card.cardId);
      success++;
    } catch (err) {
      failed.push(card.cardId);
      console.error(`[prerender] Failed to render ${card.cardId}:`, err);
    }
  }

  return { success, failed };
}
