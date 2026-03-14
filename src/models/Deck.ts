import mongoose, { Schema, Document, Model } from 'mongoose';

export interface DeckDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  /** Ordered list of Card ObjectIds (MIN_DECK_SIZE..MAX_DECK_SIZE cards) */
  cards: mongoose.Types.ObjectId[];
  /** Whether this is the player's active deck for matchmaking */
  isActive: boolean;
  /** Per-deck card-back image override (falls back to user preference) */
  cardBack?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeckSchema = new Schema<DeckDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    cards: [{ type: Schema.Types.ObjectId, ref: 'Card' }],
    isActive: { type: Boolean, default: false },
    cardBack: { type: String },
  },
  { timestamps: true },
);

// Each user can have multiple decks but only one active
DeckSchema.index({ userId: 1 });
DeckSchema.index({ userId: 1, isActive: 1 });

const DeckModel: Model<DeckDocument> =
  mongoose.models.Deck ?? mongoose.model<DeckDocument>('Deck', DeckSchema);

export default DeckModel;
