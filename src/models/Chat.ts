import mongoose, { Schema } from 'mongoose';

export interface IChat extends mongoose.Document {
  participants: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema: Schema = new Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IChat>('Chat', ChatSchema);