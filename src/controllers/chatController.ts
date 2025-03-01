// controllers/chatController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Chat from '../models/Chat';
import Message from '../models/Message';
import User from '../models/User';
import { CreateChatInput, CreateMessageInput, GetChatsByUserInput, GetMessagesByChatInput, MarkMessagesAsReadInput } from '../types/chat.types';

// @desc    Create a new chat or get existing chat between users
// @route   POST /api/chats
// @access  Private
export const createOrGetChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { participants }: CreateChatInput = req.body;
    
    // Ensure current user is part of the participants
    const userId = req.user._id;
    if (!participants.includes(userId.toString())) {
      participants.push(userId.toString());
    }
    
    // Convert participant IDs to ObjectIDs
    const participantObjectIds = participants.map(id => new mongoose.Types.ObjectId(id));
    
    // Check if all participants exist
    const userCount = await User.countDocuments({
      _id: { $in: participantObjectIds }
    });
    
    if (userCount !== participants.length) {
      res.status(400).json({ message: 'One or more users do not exist' });
      return;
    }
    
    // Check if chat already exists with the same participants
    const existingChat = await Chat.findOne({
      participants: { $all: participantObjectIds, $size: participantObjectIds.length }
    });
    
    if (existingChat) {
      res.status(200).json(existingChat);
      return;
    }
    
    // Create new chat
    const newChat = await Chat.create({
      participants: participantObjectIds
    });
    
    await newChat.populate('participants', 'username email');
    
    res.status(201).json(newChat);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'An unknown error occurred' });
    }
  }
};

// @desc    Get all chats for a user
// @route   GET /api/chats
// @access  Private
export const getChatsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    
    const chats = await Chat.find({
      participants: userId
    })
    .populate('participants', 'username email')
    .sort({ updatedAt: -1 });
    
    // Get the last message for each chat
    const chatsWithLastMessage = await Promise.all(chats.map(async (chat) => {
      const lastMessage = await Message.findOne({ chat: chat._id })
        .sort({ createdAt: -1 })
        .populate('sender', 'username');
      
      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        sender: { $ne: userId },
        readBy: { $ne: userId }
      });
      
      return {
        ...chat.toObject(),
        lastMessage,
        unreadCount
      };
    }));
    
    res.status(200).json(chatsWithLastMessage);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

// @desc    Get chat by ID
// @route   GET /api/chats/:id
// @access  Private
export const getChatById = async (req: Request, res: Response): Promise<void> => {
  try {
    const chatId = req.params.id;
    const userId = req.user._id;
    
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    }).populate('participants', 'username email');
    
    if (!chat) {
      res.status(404).json({ message: 'Chat not found' });
      return;
    }
    
    res.status(200).json(chat);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, chatId, receiverId }: CreateMessageInput = req.body;
    const senderId = req.user._id;
    
    // If chatId is not provided but receiverId is, find or create a chat
    let finalChatId = chatId;
    
    if (!chatId && receiverId) {
      // Check if receiver exists
      const receiver = await User.findById(receiverId);
      
      if (!receiver) {
        res.status(404).json({ message: 'Receiver not found' });
        return;
      }
      
      // Look for existing chat
      const existingChat = await Chat.findOne({
        participants: { 
          $all: [senderId, new mongoose.Types.ObjectId(receiverId)],
          $size: 2
        }
      });
      
      if (existingChat) {
        finalChatId = existingChat._id.toString();
      } else {
        // Create new chat
        const newChat = await Chat.create({
          participants: [senderId, new mongoose.Types.ObjectId(receiverId)]
        });
        
        finalChatId = newChat._id.toString();
      }
    } else if (!chatId) {
      res.status(400).json({ message: 'Chat ID or receiver ID is required' });
      return;
    }
    
    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: finalChatId,
      participants: senderId
    });
    
    if (!chat) {
      res.status(403).json({ message: 'Not authorized to message in this chat' });
      return;
    }
    
    // Create the message
    const newMessage = await Message.create({
      chat: finalChatId,
      sender: senderId,
      content,
      readBy: [senderId]
    });
    
    // Update chat's lastActivity timestamp
    await Chat.findByIdAndUpdate(finalChatId, { updatedAt: new Date() });
    
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'username email')
      .populate('chat');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'An unknown error occurred' });
    }
  }
};

// @desc    Get messages for a chat
// @route   GET /api/chats/:chatId/messages
// @access  Private
export const getMessagesByChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const chatId = req.params.chatId;
    const userId = req.user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    });
    
    if (!chat) {
      res.status(403).json({ message: 'Not authorized to view this chat' });
      return;
    }
    
    // Get messages
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const totalMessages = await Message.countDocuments({ chat: chatId });
    
    res.status(200).json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chats/:chatId/read
// @access  Private
export const markMessagesAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const chatId = req.params.chatId;
    const userId = req.user._id;
    
    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    });
    
    if (!chat) {
      res.status(403).json({ message: 'Not authorized to access this chat' });
      return;
    }
    
    // Mark all unread messages as read
    const result = await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        readBy: { $ne: userId }
      },
      {
        $addToSet: { readBy: userId }
      }
    );
    
    res.status(200).json({ message: 'Messages marked as read', updatedCount: result.modifiedCount });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};