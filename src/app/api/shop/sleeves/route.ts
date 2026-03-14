import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/utils";
import connectDB from "@/lib/mongodb";
import { auth } from "@/lib/nextauth";
import SleeveModel from "@/models/Sleeve";
import UserModel from "@/models/User";
import TransactionModel from "@/models/Transaction";
import mongoose from "mongoose";

export async function GET() {
  await connectDB();
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);

  const sleeves = await SleeveModel.find({ isActive: true })
    .lean()
    .sort({ price: 1 });
  return apiOk(sleeves);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return apiError("Not logged in", 401);

  await connectDB();
  const userId = (session.user as any).id;

  try {
    const { sleeveId } = await req.json();
    if (!sleeveId) return apiError("Sleeve ID required", 400);

    const sd = await mongoose.startSession();
    sd.startTransaction();

    try {
      const sleeve = await SleeveModel.findOne({ _id: sleeveId, isActive: true }).session(sd);
      if (!sleeve) {
        await sd.abortTransaction();
        return apiError("Sleeve not found or not active", 404);
      }

      const user = await UserModel.findById(userId).session(sd);
      if (!user) {
        await sd.abortTransaction();
        return apiError("User not found", 404);
      }

      if (user.ownedSleeves?.includes(sleeve._id as any)) {
        await sd.abortTransaction();
        return apiError("You already own this sleeve", 400);
      }

      if (user.currency < sleeve.price) {
        await sd.abortTransaction();
        return apiError("Insufficient currency", 400);
      }

      user.currency -= sleeve.price;
      user.ownedSleeves.push(sleeve._id as any);
      await user.save({ session: sd });

      await TransactionModel.create(
        [
          {
            userId,
            amount: -sleeve.price,
            type: "purchase",
            description: `Bought sleeve: ${sleeve.name}`,
          },
        ],
        { session: sd }
      );

      await sd.commitTransaction();
      sd.endSession();

      return apiOk({
        message: "Sleeve acquired",
        remainingCurrency: user.currency,
        sleeve: {
          name: sleeve.name,
          rarity: sleeve.rarity,
          imageUrl: sleeve.imageUrl,
        },
      });
    } catch (err: any) {
      await sd.abortTransaction();
      throw err;
    } finally {
      sd.endSession();
    }
  } catch (e: any) {
    console.error("Sleeve purchase error:", e);
    return apiError(e.message ?? "Purchase failed", 500);
  }
}