/**
 * GET /api/cards/render/[name]
 *
 * Serves a pre-rendered card PNG from R2 when available.
 * Falls back to on-demand Satori+Sharp rendering for:
 *   - stat overrides (?atk=&def=)  — combo bonus cards
 *   - cards that haven't been pre-rendered yet
 *
 * Response: 302 redirect to R2 CDN  or  200 image/png (on-demand).
 */

import { NextRequest, NextResponse } from "next/server";
import { registry } from "@/lib/cards/registry";
import "@/lib/cards/sets/legacy-base";
import connectDB from "@/lib/mongodb";
import CardModel from "@/models/Card";
import { renderCardPng } from "@/lib/cards/render/renderCard";
import type { CardRenderData } from "@/lib/cards/render/CardTemplate";

// Always re-run this route — never let Next.js cache the handler
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  await connectDB();

  // Sequential exact lookups — cardId first (unique slug), then name.
  // Avoids the $or + findOne pitfall where MongoDB may return the wrong
  // document when multiple $or branches partially match different docs.
  let dbCard = await CardModel.findOne({ cardId: decodedName, isActive: true }).lean()
    ?? await CardModel.findOne({ cardId: decodedName.toLowerCase(), isActive: true }).lean()
    ?? await CardModel.findOne({
         name: { $regex: new RegExp(`^${decodedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
         isActive: true,
       }).lean();

  if (!dbCard) {
    return NextResponse.json(
      { error: `Card not found: ${decodedName}` },
      { status: 404 },
    );
  }

  // Allow stat overrides via query params (for combo bonus stats)
  const atkParam = request.nextUrl.searchParams.get("atk");
  const defParam = request.nextUrl.searchParams.get("def");
  const hasStatOverride =
    (atkParam != null && Number(atkParam) !== dbCard.attack) ||
    (defParam != null && Number(defParam) !== dbCard.defense);

  // ── Fast path: serve pre-rendered PNG from R2 (no server CPU) ──
  if (!hasStatOverride && dbCard.renderUrl) {
    return NextResponse.redirect(dbCard.renderUrl, {
      status: 302,
      headers: {
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  }

  // ── Slow path: on-demand render (stat overrides or no pre-render yet) ──
  const def = dbCard.cardId ? registry.get(dbCard.cardId) : undefined;
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  const renderData: CardRenderData = {
    cardId: dbCard.cardId,
    name: dbCard.name,
    description: dbCard.description,
    type: dbCard.type as CardRenderData["type"],
    imageUrl: dbCard.imageUrl,
    attack: atkParam ? Number(atkParam) : dbCard.attack,
    defense: defParam ? Number(defParam) : dbCard.defense,
    rarity: dbCard.rarity,
    characterType: def?.characterType ?? (dbCard as any).characterType,
    effects: (dbCard.effects ?? []).map((e: any) => ({ description: e.description })),
  };

  const png = await renderCardPng(renderData, baseUrl);

  return new NextResponse(png as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=300, must-revalidate",
    },
  });
}
