import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/utils";
import connectDB from "@/lib/mongodb";
import { auth } from "@/lib/nextauth";
import SleeveModel from "@/models/Sleeve";

export async function GET() {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== "admin") {
    return apiError("Unauthorized", 401);
  }
  const sleeves = await SleeveModel.find().lean().sort({ createdAt: -1 });
  return apiOk(sleeves);
}

export async function POST(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== "admin") {
    return apiError("Unauthorized", 401);
  }

  const body = await req.json();
  const { name, description, imageUrl, price, rarity, isActive, isFeatured } = body;

  if (!name || !imageUrl || price === undefined) {
    return apiError("Missing required fields: name, imageUrl, price", 400);
  }

  const sleeve = await SleeveModel.create({
    name,
    description,
    imageUrl,
    price,
    rarity: rarity || "normal",
    isActive: isActive !== undefined ? isActive : true,
    isFeatured: isFeatured !== undefined ? isFeatured : false,
  });

  return apiOk(sleeve, 201);
}

export async function PATCH(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== "admin") {
    return apiError("Unauthorized", 401);
  }

  const body = await req.json();
  const { sleeveId, ...updates } = body;
  if (!sleeveId) return apiError("sleeveId is required", 400);

  const sleeve = await SleeveModel.findByIdAndUpdate(
    sleeveId,
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();

  if (!sleeve) return apiError("Sleeve not found", 404);
  return apiOk(sleeve);
}

export async function DELETE(req: NextRequest) {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session || (session.user as any).role !== "admin") {
    return apiError("Unauthorized", 401);
  }

  const { sleeveId } = await req.json();
  if (!sleeveId) return apiError("sleeveId is required", 400);

  const sleeve = await SleeveModel.findByIdAndUpdate(
    sleeveId,
    { isActive: false },
    { returnDocument: "after" }
  ).lean();

  if (!sleeve) return apiError("Sleeve not found", 404);
  return apiOk({ message: "Sleeve deactivated" });
}