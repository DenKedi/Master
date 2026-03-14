import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/utils";
import connectDB from "@/lib/mongodb";
import { auth } from "@/lib/nextauth";
import CardModel from "@/models/Card";
import UserModel from "@/models/User";
import CollectionModel from "@/models/Collection";
import TransactionModel from "@/models/Transaction";
import mongoose from "mongoose";

const CARD_PRICES_BY_RARITY: Record<string, number> = {
  normal: 25,
  nice: 100,
  special: 500,
  uiiiii: 1000,
  unknown: 5000,
};

function getCardPrice(rarity: string): number {
  return CARD_PRICES_BY_RARITY[rarity.toLowerCase()] ?? 5000;
}

// GET /api/shop/cards — return owned card IDs for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user) return apiError("Not logged in", 401);

  await connectDB();
  const userId = (session.user as any).id;

  const owned = await CollectionModel.find({ userId }).select("cardId").lean() as any[];
  const ownedIds = owned.map((e) => e.cardId.toString());
  return apiOk({ ownedIds });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return apiError("Not logged in", 401);

  await connectDB();
  const userId = (session.user as any).id;

  try {
    const { cardId } = await req.json();
    if (!cardId) return apiError("Card ID required", 400);

    const card = await CardModel.findOne({ _id: cardId, isActive: true, price: { $gt: 0 } }).lean() as any;
    if (!card) return apiError("Card not available in the Black Market", 404);

    // Enforce buy-once rule
    const alreadyOwned = await CollectionModel.findOne({ userId, cardId: card._id }).lean();
    if (alreadyOwned) return apiError("You already own this card", 400);

    // Use admin-set price; fall back to rarity-based pricing
    const price = card.price > 0 ? card.price : getCardPrice(card.rarity);

    const sd = await mongoose.startSession();
    sd.startTransaction();

    try {
      const user = await UserModel.findById(userId).session(sd);
      if (!user) {
        await sd.abortTransaction();
        return apiError("User not found", 404);
      }
      if (user.currency < price) {
        await sd.abortTransaction();
        return apiError("Insufficient currency", 400);
      }

      user.currency -= price;
      await user.save({ session: sd });

      await TransactionModel.create(
        [
          {
            userId,
            amount: -price,
            type: "purchase",
            description: `Bought card: ${card.name}`,
          },
        ],
        { session: sd }
      );

      const collEntry = await CollectionModel.findOne({ userId, cardId }).session(sd);
      if (collEntry) {
        collEntry.quantity += 1;
        await collEntry.save({ session: sd });
      } else {
        await CollectionModel.create([{ userId, cardId, quantity: 1 }], { session: sd });
      }

      await sd.commitTransaction();
      sd.endSession();

      return apiOk({
        message: "Card acquired",
        remainingCurrency: user.currency,
        card: {
          name: card.name,
          rarity: card.rarity,
          type: card.type,
          attack: card.attack,
          defense: card.defense,
          characterType: card.characterType,
          quantity: 1,
        },
      });
    } catch (err: any) {
      await sd.abortTransaction();
      sd.endSession();
      throw err;
    }
  } catch (e: any) {
    console.error("Single card purchase error:", e);
    return apiError(e.message ?? "Purchase failed", 500);
  }
}
