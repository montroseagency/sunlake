'use client';

import { useState, useEffect, useRef } from 'react';
import { useMessaging } from '@/hooks/useMessaging';
import MessageBubble from './MessageBubble';

interface Conversation {
  _id: string;
  customer_id: number;
  customer_email: string;
  customer_name: string;
  status: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

interface Props {
  token: string;
}

export default function AdminMessaging({ token }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    messages,
    sendMessage,
    markAsRead,
    isTyping: customerIsTyping,
    sendTyping,
    joinConversation
  } = useMessaging(token);

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MESSAGING_URL}/api/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.data || await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchConversations();

      // Poll for new conversations every 30 seconds
      const interval = setInterval(fetchConversations, 30000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [token]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Join conversation and mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      joinConversation(selectedConversation._id);

      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && !lastMessage.is_read && lastMessage.sender_type === 'customer') {
          markAsRead(selectedConversation._id);
        }
      }
    }
  }, [selectedConversation, joinConversation]);

  const handleSend = () => {
    if (messageText.trim() && selectedConversation) {
      sendMessage(selectedConversation._id, messageText.trim());
      setMessageText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    if (selectedConversation) {
      sendTyping(selectedConversation._id, true);
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-full bg-white rounded-lg shadow overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r border-neutral-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 bg-gradient-to-r from-primary-500 to-primary-600">
          <h3 className="font-semibold text-white text-lg">Customer Messages</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
            <p className="text-xs text-white/90">
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-neutral-600">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation._id}
                onClick={() => setSelectedConversation(conversation)}
                className={`w-full p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors text-left ${
                  selectedConversation?._id === conversation._id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {conversation.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-neutral-900 truncate">{conversation.customer_name}</h4>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <span className="bg-primary-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 truncate">{conversation.customer_email}</p>
                    {conversation.last_message && (
                      <p className="text-xs text-neutral-500 mt-1 truncate">{conversation.last_message}</p>
                    )}
                    {conversation.last_message_time && (
                      <p className="text-xs text-neutral-400 mt-1">{formatTime(conversation.last_message_time)}</p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                  {selectedConversation.customer_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">{selectedConversation.customer_name}</h3>
                  <p className="text-sm text-neutral-600">{selectedConversation.customer_email}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-neutral-500">No messages yet</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message._id}
                      content={message.content}
                      timestamp={message.created_at}
                      isSent={message.sender_type === 'admin'}
                      read={message.is_read}
                    />
                  ))}
                  {customerIsTyping && (
                    <div className="flex items-center gap-2 text-neutral-500 text-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span>Customer is typing...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-neutral-200 bg-white">
              <div className="flex gap-2">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onInput={handleTyping}
                  placeholder="Type your reply..."
                  rows={2}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!messageText.trim() || !isConnected}
                  className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors self-end"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-neutral-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-1">Select a Conversation</h3>
              <p className="text-sm text-neutral-600">Choose a customer to view their messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
