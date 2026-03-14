import mongoose, { Schema, Document, Model } from 'mongoose';

export interface UserPreferences {
  /** Default card-back image path for all decks (overridden per-deck) */
  cardBack?: string;
}

export interface UserDocument extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  currency: number;
  xp: number;
  friends: mongoose.Types.ObjectId[];
  ownedSleeves: mongoose.Types.ObjectId[];
  avatarUrl?: string;
  isActive: boolean;
  tutorialCompleted: boolean;
  tutorialStep: number;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    currency: { type: Number, default: 500, min: 0 },
    xp: { type: Number, default: 0, min: 0 },
    friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    ownedSleeves: [{ type: Schema.Types.ObjectId, ref: 'Sleeve' }],
    avatarUrl: { type: String },
    isActive: { type: Boolean, default: true },
    tutorialCompleted: { type: Boolean, default: false },
    tutorialStep: { type: Number, default: 0, min: 0 },
    preferences: new Schema(
      {
        cardBack: { type: String, default: '/card-back.webp' },
      },
      { _id: false },
    ),
  },
  { timestamps: true },
);

const UserModel: Model<UserDocument> =
  mongoose.models.User ?? mongoose.model<UserDocument>('User', UserSchema);

export default UserModel;
