// websocket.ts
import { Server } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from './models/User';
import { ExtendedError } from 'socket.io/dist/namespace';

interface SocketUser {
  userId: string;
  socketId: string;
}

interface MessageData {
  senderId: string;
  receiverId: string;
  chatId: string;
  content: string;
}

interface TypingData {
  chatId: string;
  userId: string;
}

interface ReadReceiptData {
  chatId: string;
  userId: string;
  messageIds: string[];
}

export default function setupWebsocket(server: Server): void {
  const io = new SocketServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Store connected users
  let users: SocketUser[] = [];

  // Add user to connected users
  const addUser = (userId: string, socketId: string): void => {
    !users.some((user) => user.userId === userId) &&
      users.push({ userId, socketId });
  };

  // Remove user from connected users
  const removeUser = (socketId: string): void => {
    users = users.filter((user) => user.socketId !== socketId);
  };

  // Get a user by userId
  const getUser = (userId: string): SocketUser | undefined => {
    return users.find((user) => user.userId === userId);
  };

  // Authentication middleware
  io.use(async (socket: Socket, next: (err?: ExtendedError) => void) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default_secret'
      ) as { id: string };
      
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      socket.data.user = user;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Add user to online users
    socket.on('addUser', (userId: string) => {
      addUser(userId, socket.id);
      io.emit('getUsers', users);
    });

    // Send and receive messages
    socket.on('sendMessage', ({ senderId, receiverId, chatId, content }: MessageData) => {
      const user = getUser(receiverId);
      
      // Emit to the specific user if they're online
      if (user) {
        io.to(user.socketId).emit('getMessage', {
          senderId,
          content,
          chatId,
          createdAt: new Date(),
        });
      }
    });

    // Typing indicators
    socket.on('typing', ({ chatId, userId }: TypingData) => {
      // Find all users in a chat except the typing user
      const chatParticipants = users.filter((user) => {
        // Logic to determine if user is in chat (would need to fetch chat details)
        return user.userId !== userId;
      });
      
      // Notify all participants that someone is typing
      chatParticipants.forEach((participant) => {
        io.to(participant.socketId).emit('userTyping', {
          chatId,
          userId,
        });
      });
    });

    // Stop typing indicator
    socket.on('stopTyping', ({ chatId, userId }: TypingData) => {
      // Similar to typing, but for stopping
      const chatParticipants = users.filter((user) => {
        return user.userId !== userId;
      });
      
      chatParticipants.forEach((participant) => {
        io.to(participant.socketId).emit('userStoppedTyping', {
          chatId,
          userId,
        });
      });
    });

    // Handle read receipts
    socket.on('markAsRead', ({ chatId, userId, messageIds }: ReadReceiptData) => {
      // Notify other participants that messages have been read
      const chatParticipants = users.filter((user) => {
        return user.userId !== userId;
      });
      
      chatParticipants.forEach((participant) => {
        io.to(participant.socketId).emit('messagesRead', {
          chatId,
          userId,
          messageIds,
        });
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      removeUser(socket.id);
      io.emit('getUsers', users);
    });
  });
}