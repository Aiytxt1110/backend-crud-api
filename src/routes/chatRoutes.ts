import express from 'express';
import {
  createOrGetChat,
  getChatsByUser,
  getChatById,
  sendMessage,
  getMessagesByChat,
  markMessagesAsRead
} from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All routes are protected
router.use(protect);

// Chat routes
router.route('/').post(createOrGetChat).get(getChatsByUser);
router.route('/:id').get(getChatById);
router.route('/:chatId/messages').get(getMessagesByChat);
router.route('/:chatId/read').put(markMessagesAsRead);

// Message routes
router.post('/messages', sendMessage);

export default router;