'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function ContactMessagesManagement() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRead, setFilterRead] = useState<string>('');
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);

  useEffect(() => {
    fetchMessages();
  }, [filterRead]);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/contact/');
      let data = response.data.results || response.data || [];

      // Filter by read status if selected
      if (filterRead === 'read') {
        data = data.filter((m: ContactMessage) => m.is_read);
      } else if (filterRead === 'unread') {
        data = data.filter((m: ContactMessage) => !m.is_read);
      }

      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await api.patch(`/contact/${messageId}/mark_read/`);
      fetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
      alert('Error marking message as read');
    }
  };

  const handleDelete = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await api.delete(`/contact/${messageId}/`);
      fetchMessages();
      alert('Message deleted successfully!');
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message');
    }
  };

  const toggleExpanded = (messageId: number) => {
    const message = messages.find(m => m.id === messageId);
    if (message && !message.is_read) {
      handleMarkAsRead(messageId);
    }
    setExpandedMessage(expandedMessage === messageId ? null : messageId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <div className="text-center py-8">Loading messages...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-neutral-900">Contact Messages</h2>

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterRead('')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterRead === ''
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All ({messages.length})
          </button>
          <button
            onClick={() => setFilterRead('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterRead === 'unread'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Unread ({messages.filter(m => !m.is_read).length})
          </button>
          <button
            onClick={() => setFilterRead('read')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterRead === 'read'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Read ({messages.filter(m => m.is_read).length})
          </button>
        </div>
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-lg">
          <p className="text-neutral-600">No contact messages found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden transition-all ${
                !message.is_read ? 'border-l-4 border-primary-500' : ''
              }`}
            >
              {/* Message Header */}
              <div
                className="p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => toggleExpanded(message.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {message.name}
                      </h3>
                      {!message.is_read && (
                        <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 mb-1">
                      <strong>Subject:</strong> {message.subject}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatDate(message.created_at)}
                    </p>
                  </div>
                  <svg
                    className={`w-6 h-6 text-neutral-400 transition-transform ${
                      expandedMessage === message.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedMessage === message.id && (
                <div className="border-t border-neutral-200 p-4 bg-neutral-50">
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Email:</p>
                      <p className="text-sm text-neutral-900">
                        <a href={`mailto:${message.email}`} className="text-primary-500 hover:underline">
                          {message.email}
                        </a>
                      </p>
                    </div>
                    {message.phone && (
                      <div>
                        <p className="text-sm font-medium text-neutral-700">Phone:</p>
                        <p className="text-sm text-neutral-900">
                          <a href={`tel:${message.phone}`} className="text-primary-500 hover:underline">
                            {message.phone}
                          </a>
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Message:</p>
                      <p className="text-sm text-neutral-900 whitespace-pre-wrap mt-1">
                        {message.message}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!message.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(message.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
