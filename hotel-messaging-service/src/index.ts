import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import conversationRoutes from './routes/conversationRoutes';
import { setupSocketHandlers } from './socket/socketHandler';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hotel-messaging-service' });
});

app.use('/api/conversations', conversationRoutes);

// Setup Socket.io handlers
setupSocketHandlers(io);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-messaging';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✓ Connected to MongoDB');
    console.log(`  Database: ${MONGODB_URI}`);
  })
  .catch((error) => {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  });

// Start server
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  Hotel Messaging Service');
  console.log('═══════════════════════════════════════════════');
  console.log(`  ✓ HTTP Server running on port ${PORT}`);
  console.log(`  ✓ Socket.io server ready`);
  console.log(`  ✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  ✓ CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log('═══════════════════════════════════════════════');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
