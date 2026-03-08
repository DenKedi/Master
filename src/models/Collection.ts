import mongoose, { Schema, Document, Model } from 'mongoose';

export interface CollectionEntryDocument extends Document {
  userId: mongoose.Types.ObjectId;
  cardId: mongoose.Types.ObjectId;
  quantity: number;
  obtainedAt: Date;
}

const CollectionEntrySchema = new Schema<CollectionEntryDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cardId: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
  quantity: { type: Number, default: 1, min: 0 },
  obtainedAt: { type: Date, default: Date.now },
});

CollectionEntrySchema.index({ userId: 1, cardId: 1 }, { unique: true });

const CollectionModel: Model<CollectionEntryDocument> =
  mongoose.models.Collection ??
  mongoose.model<CollectionEntryDocument>('Collection', CollectionEntrySchema);

export default CollectionModel;
