import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  searchUsers
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/users/search', protect, searchUsers);

export default router;