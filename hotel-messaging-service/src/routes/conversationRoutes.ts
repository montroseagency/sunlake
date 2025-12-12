import express from 'express';
import {
  createConversation,
  getConversations,
  getConversationById,
  getConversationMessages,
  sendMessage,
  closeConversation,
} from '../controllers/conversationController';
import { authenticate, isAdmin } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createConversation);
router.get('/', getConversations);
router.get('/:id', getConversationById);
router.get('/:id/messages', getConversationMessages);
router.post('/:id/messages', sendMessage);
router.patch('/:id/close', isAdmin, closeConversation);

export default router;
