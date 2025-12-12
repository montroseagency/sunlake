'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const MESSAGING_URL = process.env.NEXT_PUBLIC_MESSAGING_URL || 'http://localhost:3001';

export interface Message {
  _id: string;
  conversation_id: string;
  sender_id: number;
  sender_type: 'customer' | 'admin';
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  _id: string;
  customer_id: number;
  customer_email: string;
  customer_name: string;
  admin_id?: number;
  status: 'open' | 'closed';
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export const useMessaging = (token: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(MESSAGING_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✓ Connected to messaging service');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('✗ Disconnected from messaging service');
      setIsConnected(false);
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    // Listen for new messages
    newSocket.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for conversation messages (initial load)
    newSocket.on('conversation_messages', (msgs: Message[]) => {
      setMessages(msgs);
    });

    // Admin online/offline
    newSocket.on('admin_online', () => {
      setAdminOnline(true);
    });

    newSocket.on('admin_offline', () => {
      setAdminOnline(false);
    });

    // Typing indicator
    newSocket.on('user_typing', (data: { user_id: number; user_name: string; is_typing: boolean }) => {
      setIsTyping(data.is_typing);
      if (data.is_typing && typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    // Messages read
    newSocket.on('messages_read', () => {
      setMessages((prev) =>
        prev.map((msg) => ({ ...msg, is_read: true }))
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Join conversation
  const joinConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('join_conversation', conversationId);
      setCurrentConversation(conversationId);
    }
  }, [socket, isConnected]);

  // Send message
  const sendMessage = useCallback((conversationId: string, content: string) => {
    if (socket && isConnected && content.trim()) {
      socket.emit('send_message', {
        conversation_id: conversationId,
        content: content.trim(),
      });
    }
  }, [socket, isConnected]);

  // Send typing indicator
  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit('typing', { conversation_id: conversationId, is_typing: isTyping });
    }
  }, [socket, isConnected]);

  // Mark messages as read
  const markAsRead = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('mark_read', { conversation_id: conversationId });
    }
  }, [socket, isConnected]);

  // Close conversation (admin only)
  const closeConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('close_conversation', { conversation_id: conversationId });
    }
  }, [socket, isConnected]);

  return {
    socket,
    isConnected,
    messages,
    conversations,
    setConversations,
    currentConversation,
    isTyping,
    adminOnline,
    joinConversation,
    sendMessage,
    sendTyping,
    markAsRead,
    closeConversation,
  };
};
