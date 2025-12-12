# Hotel Messaging Service

Real-time messaging service for hotel customer-admin communication using Socket.io and MongoDB.

## Features

- Real-time bidirectional messaging between customers and administrators
- JWT authentication
- Message read receipts
- Typing indicators
- Conversation management
- REST API for message history
- Admin online/offline status

## Prerequisites

- Node.js >= 16
- MongoDB (running locally or connection string)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Update `.env` with your settings:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/hotel-messaging
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### REST API

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

- `GET /health` - Health check
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations` - List conversations
- `GET /api/conversations/:id` - Get conversation details
- `GET /api/conversations/:id/messages` - Get conversation messages
- `POST /api/conversations/:id/messages` - Send message (REST fallback)
- `PATCH /api/conversations/:id/close` - Close conversation (admin only)

### Socket.io Events

**Client → Server:**
- `join_conversation` - Join a conversation room
- `send_message` - Send a message
- `mark_read` - Mark messages as read
- `typing` - Send typing indicator
- `close_conversation` - Close conversation (admin only)

**Server → Client:**
- `conversation_messages` - Initial message history
- `new_message` - New message in conversation
- `customer_message` - Customer sent message (admin only)
- `admin_message` - Admin sent message (customer only)
- `messages_read` - Messages marked as read
- `user_typing` - User is typing
- `conversation_closed` - Conversation closed
- `admin_online` - Admin came online
- `admin_offline` - Admin went offline
- `error` - Error message

## Integration with Django Backend

The service expects JWT tokens issued by the Django backend with the following payload:
```json
{
  "id": 123,
  "email": "user@example.com",
  "role": "CUSTOMER" | "ADMIN" | "STAFF"
}
```

The JWT secret must match between Django and this service.

## Architecture

- **Express**: REST API server
- **Socket.io**: Real-time WebSocket communication
- **MongoDB**: Message and conversation persistence
- **TypeScript**: Type-safe development
- **JWT**: Authentication and authorization
