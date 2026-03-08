import mongoose, { Schema, Document, Model } from 'mongoose';
import { TransactionType } from '@/types';

export interface TransactionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const TransactionSchema = new Schema<TransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'pack_purchase',
        'currency_grant',
        'currency_spend',
        'xp_grant',
        'refund',
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1 });

const TransactionModel: Model<TransactionDocument> =
  mongoose.models.Transaction ??
  mongoose.model<TransactionDocument>('Transaction', TransactionSchema);

export default TransactionModel;
