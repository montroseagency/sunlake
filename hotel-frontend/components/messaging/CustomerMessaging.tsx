'use client';

import { useState, useEffect, useRef } from 'react';
import { useMessaging } from '@/hooks/useMessaging';
import MessageBubble from './MessageBubble';

interface Props {
  userId: number;
  userEmail: string;
  userName: string;
  token: string;
}

export default function CustomerMessaging({ userId, userEmail, userName, token }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    messages,
    sendMessage,
    markAsRead,
    isAdminOnline,
    isTyping: adminIsTyping,
    sendTypingIndicator
  } = useMessaging(token);

  // Initialize conversation
  useEffect(() => {
    const initConversation = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_MESSAGING_URL}/api/conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            customer_id: userId,
            customer_email: userEmail,
            customer_name: userName,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setConversationId(data._id);
        }
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    if (token && userId) {
      initConversation();
    }
  }, [token, userId, userEmail, userName]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when visible
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && !lastMessage.read && lastMessage.sender_type === 'admin') {
        markAsRead(conversationId);
      }
    }
  }, [messages, conversationId, markAsRead]);

  const handleSend = () => {
    if (messageText.trim() && conversationId) {
      sendMessage(conversationId, messageText.trim());
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
    if (conversationId) {
      sendTypingIndicator(conversationId, true);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-2"></div>
          <p className="text-neutral-600">Initializing chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">Hotel Support</h3>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isAdminOnline ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                <p className="text-xs text-white/90">
                  {isAdminOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${isConnected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span className="text-xs text-white font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">Start a Conversation</h3>
            <p className="text-sm text-neutral-600 max-w-xs">
              Send a message to our support team. We're here to help!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                content={message.content}
                timestamp={message.timestamp}
                isSent={message.sender_type === 'customer'}
                read={message.read}
              />
            ))}
            {adminIsTyping && (
              <div className="flex items-center gap-2 text-neutral-500 text-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span>Support is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-neutral-200 bg-white">
        <div className="flex gap-2">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            onInput={handleTyping}
            placeholder="Type your message..."
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
    </div>
  );
}
