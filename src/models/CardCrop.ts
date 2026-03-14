import mongoose, { Schema, Document, Model } from 'mongoose';

export interface CardCropDocument extends Document {
  cardId: string;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  updatedAt: Date;
}

const CardCropSchema = new Schema<CardCropDocument>(
  {
    cardId: { type: String, required: true, unique: true, trim: true },
    crop: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true },
    },
  },
  { timestamps: true },
);

const CardCropModel: Model<CardCropDocument> =
  mongoose.models.CardCrop ?? mongoose.model<CardCropDocument>('CardCrop', CardCropSchema);

export default CardCropModel;
