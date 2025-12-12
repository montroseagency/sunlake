import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  customer_id: number;
  customer_email: string;
  customer_name: string;
  admin_id?: number;
  status: 'open' | 'closed';
  last_message?: string;
  last_message_time?: Date;
  created_at: Date;
  updated_at: Date;
}

const ConversationSchema: Schema = new Schema(
  {
    customer_id: {
      type: Number,
      required: true,
      index: true,
    },
    customer_email: {
      type: String,
      required: true,
    },
    customer_name: {
      type: String,
      required: true,
    },
    admin_id: {
      type: Number,
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
    last_message: String,
    last_message_time: Date,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Index for finding customer's conversations
ConversationSchema.index({ customer_id: 1, created_at: -1 });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
