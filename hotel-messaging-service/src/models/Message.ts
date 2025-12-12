import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversation_id: mongoose.Types.ObjectId;
  sender_id: number;
  sender_type: 'customer' | 'admin';
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: Date;
}

const MessageSchema: Schema = new Schema(
  {
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender_id: {
      type: Number,
      required: true,
    },
    sender_type: {
      type: String,
      enum: ['customer', 'admin'],
      required: true,
    },
    sender_name: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// Index for querying messages by conversation
MessageSchema.index({ conversation_id: 1, created_at: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
