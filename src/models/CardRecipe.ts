import mongoose, { Schema, Document, Model } from 'mongoose';

export interface CardRecipeDocument extends Document {
  ingredientA: mongoose.Types.ObjectId; // base card
  ingredientB: mongoose.Types.ObjectId; // base card
  result: mongoose.Types.ObjectId; // advanced card produced
  createdAt: Date;
  updatedAt: Date;
}

const CardRecipeSchema = new Schema<CardRecipeDocument>(
  {
    ingredientA: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
    ingredientB: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
    result: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
  },
  { timestamps: true },
);

// Ensure no duplicate recipe (order-independent via app logic)
CardRecipeSchema.index({ ingredientA: 1, ingredientB: 1 }, { unique: true });
CardRecipeSchema.index({ result: 1 });

const CardRecipeModel: Model<CardRecipeDocument> =
  mongoose.models.CardRecipe ??
  mongoose.model<CardRecipeDocument>('CardRecipe', CardRecipeSchema);

export default CardRecipeModel;
