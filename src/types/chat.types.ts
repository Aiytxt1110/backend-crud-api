import { Document } from 'mongoose';

export interface CreateChatInput {
  participants: string[];
}

export interface CreateMessageInput {
  content: string;
  chatId?: string;
  receiverId?: string;
}

export interface GetChatsByUserInput {
  userId: string;
}

export interface GetMessagesByChatInput {
  chatId: string;
  page?: number;
  limit?: number;
}

export interface MarkMessagesAsReadInput {
  chatId: string;
  userId: string;
}
