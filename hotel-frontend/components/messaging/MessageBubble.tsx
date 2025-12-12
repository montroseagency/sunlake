'use client';

import { Message } from '@/hooks/useMessaging';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && (
          <div className="text-xs text-neutral-500 mb-1 px-2">{message.sender_name}</div>
        )}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwnMessage
              ? 'bg-primary-500 text-white rounded-br-none'
              : 'bg-neutral-100 text-neutral-900 rounded-bl-none'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          <div className={`flex items-center gap-1 mt-1 text-xs ${isOwnMessage ? 'text-primary-100' : 'text-neutral-500'}`}>
            <span>{time}</span>
            {isOwnMessage && (
              <svg
                className={`w-4 h-4 ${message.is_read ? 'text-blue-200' : 'text-primary-200'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {message.is_read ? (
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                ) : (
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                )}
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
