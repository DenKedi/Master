import mongoose, { Schema, Document, Model } from 'mongoose';
import { PackType, CardRarity } from '@/types';

export interface PackDocument extends Document {
  name: string;
  description: string;
  price: number;
  cardCount: number;
  guaranteedRarity?: CardRarity;
  imageUrl: string;
  type: PackType;
  isActive: boolean;
  discount?: number;
  expiresAt?: Date;
  bundleItems: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PackSchema = new Schema<PackDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    cardCount: { type: Number, required: true, min: 1 },
    guaranteedRarity: {
      type: String,
      enum: ['normal', 'nice', 'special', 'uiiiii', 'unknown'],
    },
    imageUrl: { type: String, required: true },
    type: {
      type: String,
      enum: ['standard', 'premium', 'sale', 'bundle'],
      default: 'standard',
    },
    isActive: { type: Boolean, default: true },
    discount: { type: Number, min: 0, max: 100 },
    expiresAt: { type: Date },
    bundleItems: [{ type: Schema.Types.ObjectId, ref: 'Pack' }],
  },
  { timestamps: true },
);

PackSchema.index({ isActive: 1, type: 1 });

const PackModel: Model<PackDocument> =
  mongoose.models.Pack ?? mongoose.model<PackDocument>('Pack', PackSchema);

export default PackModel;
