import { Request, Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';

export const createConversation = async (req: Request, res: Response) => {
  try {
    const { customer_id, customer_email, customer_name } = req.body;

    // Check if conversation already exists for this customer
    let conversation = await Conversation.findOne({
      customer_id,
      status: 'open',
    });

    if (conversation) {
      return res.json(conversation);
    }

    // Create new conversation
    conversation = await Conversation.create({
      customer_id,
      customer_email,
      customer_name,
      status: 'open',
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Error creating conversation' });
  }
};

export const getConversations = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    let query: any = {};

    // Customers see only their conversations
    if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
      query.customer_id = user.id;
    }

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const conversations = await Conversation.find(query)
      .sort({ last_message_time: -1, created_at: -1 })
      .limit(50);

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation_id: conv._id,
          sender_id: { $ne: user.id },
          is_read: false,
        });

        return {
          ...conv.toObject(),
          unread_count: unreadCount,
        };
      })
    );

    res.json(conversationsWithUnread);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Error fetching conversations' });
  }
};

export const getConversationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify access
    const hasAccess =
      conversation.customer_id === user.id ||
      user.role === 'ADMIN' ||
      user.role === 'STAFF';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Error fetching conversation' });
  }
};

export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify access
    const hasAccess =
      conversation.customer_id === user.id ||
      user.role === 'ADMIN' ||
      user.role === 'STAFF';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const skip = parseInt(req.query.skip as string) || 0;

    const messages = await Message.find({ conversation_id: conversation._id })
      .sort({ created_at: 1 })
      .skip(skip)
      .limit(limit);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Error fetching messages' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user = (req as any).user;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify access
    const hasAccess =
      conversation.customer_id === user.id ||
      user.role === 'ADMIN' ||
      user.role === 'STAFF';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create message
    const message = await Message.create({
      conversation_id: conversation._id,
      sender_id: user.id,
      sender_type: user.role === 'ADMIN' || user.role === 'STAFF' ? 'admin' : 'customer',
      sender_name: user.email.split('@')[0],
      content: content.trim(),
      is_read: false,
    });

    // Update conversation
    conversation.last_message = content.trim();
    conversation.last_message_time = new Date();
    if (user.role === 'ADMIN' || user.role === 'STAFF') {
      conversation.admin_id = user.id;
    }
    await conversation.save();

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Error sending message' });
  }
};

export const closeConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Only admins can close conversations
    if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
      return res.status(403).json({ error: 'Only admins can close conversations' });
    }

    const conversation = await Conversation.findByIdAndUpdate(
      id,
      { status: 'closed' },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error closing conversation:', error);
    res.status(500).json({ error: 'Error closing conversation' });
  }
};
