import mongoose, { Schema, Document, Model } from 'mongoose';
import { CardRarity, CardType, CardTier, CharacterType } from '@/types';
import type { CardEffect } from '@/lib/battle/types';

export interface CardDocument extends Document {
  name: string;
  description: string;
  rarity: CardRarity;
  type: CardType;
  tier: CardTier;
  imageUrl: string;
  attack: number;
  defense: number;
  effect?: string;
  effects: CardEffect[];
  cost: number;
  tags: string[];
  characterType?: CharacterType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema = new Schema<CardDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    rarity: {
      type: String,
      enum: ['normal', 'nice', 'special', 'uiiiii', 'unknown'],
      required: true,
    },
    type: {
      type: String,
      enum: ['character', 'arsenal', 'destination', 'trick'],
      required: true,
    },
    tier: {
      type: String,
      enum: ['base', 'advanced'],
      default: 'base',
    },
    imageUrl: { type: String, required: true },
    attack: { type: Number, required: true, min: 0, default: 0 },
    defense: { type: Number, required: true, min: 0, default: 0 },
    effect: { type: String }, // legacy plain-text description
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
    cost: { type: Number, required: true, min: 0 },
    tags: [{ type: String }],
    characterType: {
      type: String,
      enum: ['human', 'goblin', 'beast', 'demon'],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CardSchema.index({ rarity: 1 });
CardSchema.index({ type: 1 });
CardSchema.index({ tier: 1 });
CardSchema.index({ isActive: 1 });

const CardModel: Model<CardDocument> =
  mongoose.models.Card ?? mongoose.model<CardDocument>('Card', CardSchema);

export default CardModel;
