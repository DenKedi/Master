import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import CardModel from "@/models/Card";
import { apiOk, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);

  await connectDB();

  // Admins see all cards; regular users only see active Black Market listings
  if ((session.user as any).role === "admin") {
    const cards = await CardModel.find({}).sort({ name: 1 }).lean();
    return apiOk(cards);
  }

  const cards = await CardModel.find({ isActive: true, price: { $gt: 0 } }).sort({ name: 1 }).lean();
  return apiOk(cards);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") return apiError("Unauthorized", 401);

  await connectDB();
  const { cardId, price, isFeatured, isActive } = await req.json();

  if (!cardId) return apiError("Card ID required", 400);

  const updated = await CardModel.findByIdAndUpdate(
    cardId,
    { price, isFeatured, isActive },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) return apiError("Card not found", 404);

  return apiOk(updated);
}
