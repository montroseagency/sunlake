'use client';

import { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import axios from 'axios';

const MESSAGING_API_URL = process.env.NEXT_PUBLIC_MESSAGING_URL || 'http://localhost:3001';

interface FloatingChatProps {
  userId: number;
  userEmail: string;
  userName: string;
  token: string;
}

export default function FloatingChat({ userId, userEmail, userName, token }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Create or get existing conversation
  const initializeConversation = async () => {
    if (conversationId) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${MESSAGING_API_URL}/api/conversations`,
        {
          customer_id: userId,
          customer_email: userEmail,
          customer_name: userName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setConversationId(response.data._id);
    } catch (error) {
      console.error('Error initializing conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !conversationId) {
      initializeConversation();
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <>
      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden border border-neutral-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary-500 text-white">
            <h3 className="font-semibold">Chat with Support</h3>
            <button
              onClick={toggleChat}
              className="text-white hover:text-neutral-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat Content */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-neutral-600">Loading chat...</p>
              </div>
            </div>
          ) : conversationId ? (
            <ChatWindow
              conversationId={conversationId}
              currentUserId={userId}
              token={token}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500">
              Unable to load chat. Please try again.
            </div>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-16 h-16 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-all hover:scale-110 z-40 flex items-center justify-center"
      >
        {isOpen ? (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
}
