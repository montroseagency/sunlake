import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Conversation from '../models/Conversation';
import Message from '../models/Message';

interface JWTPayload {
  id: number;
  email: string;
  role: string;
}

interface SocketWithUser extends Socket {
  user?: JWTPayload;
}

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware
  io.use((socket: SocketWithUser, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: SocketWithUser) => {
    console.log(`User connected: ${socket.user?.email} (${socket.user?.role})`);

    const userId = socket.user!.id;
    const userRole = socket.user!.role;

    // Join user-specific room
    socket.join(`user:${userId}`);

    // If admin, join admin room
    if (userRole === 'ADMIN' || userRole === 'STAFF') {
      socket.join('admins');
    }

    // Join a specific conversation
    socket.on('join_conversation', async (conversationId: string) => {
      try {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Verify user has access to this conversation
        const hasAccess =
          conversation.customer_id === userId ||
          (userRole === 'ADMIN' || userRole === 'STAFF');

        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        console.log(`User ${userId} joined conversation ${conversationId}`);

        // Load conversation messages
        const messages = await Message.find({ conversation_id: conversationId })
          .sort({ created_at: 1 })
          .limit(100);

        socket.emit('conversation_messages', messages);
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Error joining conversation' });
      }
    });

    // Send a message
    socket.on('send_message', async (data: {
      conversation_id: string;
      content: string;
    }) => {
      try {
        const { conversation_id, content } = data;

        if (!content || !content.trim()) {
          socket.emit('error', { message: 'Message content cannot be empty' });
          return;
        }

        const conversation = await Conversation.findById(conversation_id);

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Verify access
        const hasAccess =
          conversation.customer_id === userId ||
          (userRole === 'ADMIN' || userRole === 'STAFF');

        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Create message
        const message = await Message.create({
          conversation_id: conversation._id,
          sender_id: userId,
          sender_type: userRole === 'ADMIN' || userRole === 'STAFF' ? 'admin' : 'customer',
          sender_name: socket.user!.email.split('@')[0], // Use email username as name
          content: content.trim(),
          is_read: false,
        });

        // Update conversation
        conversation.last_message = content.trim();
        conversation.last_message_time = new Date();
        if (userRole === 'ADMIN' || userRole === 'STAFF') {
          conversation.admin_id = userId;
        }
        await conversation.save();

        // Broadcast message to conversation room
        io.to(`conversation:${conversation_id}`).emit('new_message', message);

        // Notify admins if customer sent message
        if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
          io.to('admins').emit('customer_message', {
            conversation_id,
            message,
            customer_name: conversation.customer_name,
          });
        } else {
          // Notify customer if admin sent message
          io.to(`user:${conversation.customer_id}`).emit('admin_message', {
            conversation_id,
            message,
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Mark messages as read
    socket.on('mark_read', async (data: { conversation_id: string }) => {
      try {
        const { conversation_id } = data;

        const conversation = await Conversation.findById(conversation_id);

        if (!conversation) {
          return;
        }

        // Mark all unread messages in this conversation as read
        await Message.updateMany(
          {
            conversation_id: conversation._id,
            sender_id: { $ne: userId },
            is_read: false,
          },
          { is_read: true }
        );

        io.to(`conversation:${conversation_id}`).emit('messages_read', {
          conversation_id,
          reader_id: userId,
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Typing indicator
    socket.on('typing', (data: { conversation_id: string; is_typing: boolean }) => {
      socket.to(`conversation:${data.conversation_id}`).emit('user_typing', {
        user_id: userId,
        user_name: socket.user!.email.split('@')[0],
        is_typing: data.is_typing,
      });
    });

    // Close conversation (admin only)
    socket.on('close_conversation', async (data: { conversation_id: string }) => {
      if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
        socket.emit('error', { message: 'Only admins can close conversations' });
        return;
      }

      try {
        const conversation = await Conversation.findByIdAndUpdate(
          data.conversation_id,
          { status: 'closed' },
          { new: true }
        );

        if (conversation) {
          io.to(`conversation:${data.conversation_id}`).emit('conversation_closed', {
            conversation_id: data.conversation_id,
          });
        }
      } catch (error) {
        console.error('Error closing conversation:', error);
        socket.emit('error', { message: 'Error closing conversation' });
      }
    });

    // Admin online status
    if (userRole === 'ADMIN' || userRole === 'STAFF') {
      io.emit('admin_online', { admin_id: userId });
    }

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user?.email}`);

      if (userRole === 'ADMIN' || userRole === 'STAFF') {
        io.emit('admin_offline', { admin_id: userId });
      }
    });
  });
};
