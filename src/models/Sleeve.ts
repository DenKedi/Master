import mongoose, { Schema, Document, Model } from "mongoose";

export interface SleeveDocument extends Document {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  rarity: "normal" | "nice" | "special" | "uiiiii" | "unknown";
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SleeveSchema = new Schema<SleeveDocument>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    rarity: {
      type: String,
      enum: ["normal", "nice", "special", "uiiiii", "unknown"],
      default: "normal",
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SleeveModel: Model<SleeveDocument> =
  mongoose.models.Sleeve ?? mongoose.model<SleeveDocument>("Sleeve", SleeveSchema);

export default SleeveModel;
