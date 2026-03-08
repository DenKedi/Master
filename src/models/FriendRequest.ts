import mongoose, { Schema, Document, Model } from 'mongoose';
import { FriendRequestStatus } from '@/types';

export interface FriendRequestDocument extends Document {
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FriendRequestSchema = new Schema<FriendRequestDocument>(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

FriendRequestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });
FriendRequestSchema.index({ toUserId: 1, status: 1 });

const FriendRequestModel: Model<FriendRequestDocument> =
  mongoose.models.FriendRequest ??
  mongoose.model<FriendRequestDocument>('FriendRequest', FriendRequestSchema);

export default FriendRequestModel;
