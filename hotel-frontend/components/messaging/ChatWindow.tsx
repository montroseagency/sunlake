'use client';

import { useState, useEffect, useRef } from 'react';
import { useMessaging, Message } from '@/hooks/useMessaging';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
  conversationId: string;
  currentUserId: number;
  token: string;
}

export default function ChatWindow({ conversationId, currentUserId, token }: ChatWindowProps) {
  const [messageInput, setMessageInput] = useState('');
  const [isTypingTimeout, setIsTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isConnected,
    messages,
    isTyping,
    adminOnline,
    joinConversation,
    sendMessage,
    sendTyping,
    markAsRead,
  } = useMessaging(token);

  // Join conversation on mount
  useEffect(() => {
    if (isConnected && conversationId) {
      joinConversation(conversationId);
      markAsRead(conversationId);
    }
  }, [isConnected, conversationId, joinConversation, markAsRead]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read when messages change
  useEffect(() => {
    if (messages.length > 0 && conversationId) {
      markAsRead(conversationId);
    }
  }, [messages, conversationId, markAsRead]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !conversationId) return;

    sendMessage(conversationId, messageInput);
    setMessageInput('');
    sendTyping(conversationId, false);

    if (isTypingTimeout) {
      clearTimeout(isTypingTimeout);
      setIsTypingTimeout(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    // Send typing indicator
    if (conversationId && e.target.value.trim()) {
      sendTyping(conversationId, true);

      // Clear previous timeout
      if (isTypingTimeout) {
        clearTimeout(isTypingTimeout);
      }

      // Stop typing after 3 seconds of inactivity
      const timeout = setTimeout(() => {
        sendTyping(conversationId, false);
      }, 3000);
      setIsTypingTimeout(timeout);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-primary-500 text-white border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">Hotel Support</h3>
            <p className="text-xs text-primary-100">
              {adminOnline ? '● Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-neutral-50">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwnMessage={message.sender_id === currentUserId}
              />
            ))}
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-neutral-200 rounded-2xl px-4 py-3 rounded-bl-none">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 bg-white border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-neutral-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="px-6 py-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
