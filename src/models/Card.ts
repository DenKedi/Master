import mongoose, { Schema, Document, Model } from 'mongoose';
import { CardRarity, CardType, CharacterType } from '@/types';
import type { CardEffect } from '@/lib/battle/types';

export interface CardDocument extends Document {
  cardId: string;
  name: string;
  description: string;
  rarity: CardRarity;
  type: CardType;
  imageUrl: string;
  renderUrl?: string;
  attack: number;
  defense: number;
  effect?: string;
  effects: CardEffect[];
  tags: string[];
  characterType?: CharacterType;
  isActive: boolean;
  isFeatured?: boolean;
  price?: number;
  setId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema = new Schema<CardDocument>(
  {
    cardId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    rarity: {
      type: String,
      enum: ['normal', 'nice', 'special', 'uiiiii', 'unknown'],
      default: 'normal',
    },
    type: {
      type: String,
      enum: ['character', 'arsenal', 'destination', 'trick'],
      required: true,
    },
    imageUrl: { type: String, default: '' },
    renderUrl: { type: String },
    attack: { type: Number, min: 0, default: 0 },
    defense: { type: Number, min: 0, default: 0 },
    effect: { type: String },
    effects: [
      {
        id: { type: String, required: true },
        trigger: {
          type: String,
          enum: [
            'on-play',
            'on-combo',
            'on-attack',
            'on-defend',
            'on-death',
            'passive',
            'on-discard',
          ],
          required: true,
        },
        description: { type: String, required: true },
        handler: { type: String, required: true },
        params: { type: Schema.Types.Mixed },
        timing: { type: String, enum: ['before-combat', 'after-combat'] },
      },
    ],
    tags: [{ type: String }],
    characterType: {
      type: String,
      enum: ['human', 'goblin', 'beast', 'underworld'],
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    price: { type: Number },
    setId: { type: String },
  },
  { timestamps: true },
);

CardSchema.index({ rarity: 1 });
CardSchema.index({ type: 1 });

CardSchema.index({ isActive: 1 });
CardSchema.index({ setId: 1 });

const CardModel: Model<CardDocument> =
  mongoose.models.Card ?? mongoose.model<CardDocument>('Card', CardSchema);

export default CardModel;
