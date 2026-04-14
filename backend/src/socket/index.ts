/**
 * SIMRS ZEN - Socket.IO Configuration
 * Real-time features: Chat, Notifications, Queue Updates
 *
 * WebSocket event subscriptions
 */

import jwt from 'jsonwebtoken';
import type { Server, Socket } from 'socket.io';
import { prisma } from '../config/database.js';
import { env } from '../config/Env.js';

const JWT_SECRET = env.JWT_SECRET;

interface SocketUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

interface ConnectedUser {
  socketId: string;
  user: SocketUser;
  connectedAt: Date;
}

interface ChatMessageData {
  roomId: string;
  content: string;
  messageType?: string;
}

interface IcuVitalData {
  bedId: string;
  vitalSigns: Record<string, unknown>;
}

declare module 'socket.io' {
  interface Server {
    sendNotification: (userId: string, notification: unknown) => void;
    sendRoleNotification: (role: string, notification: unknown) => void;
    broadcastQueueUpdate: (departmentId: string, queueData: unknown) => void;
    broadcastBedUpdate: (bedData: unknown) => void;
    getOnlineUsers: () => number;
    getOnlineUsersByRole: (role: string) => ConnectedUser[];
  }

  interface Socket {
    user: SocketUser;
  }
}

// Store connected users
const connectedUsers = new Map<string, ConnectedUser>();

/**
 * Initialize Socket.IO Handlers
 */
export function initializeSocketHandlers(io: Server): Server {
  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

      const user = await prisma.profiles.findUnique({
        where: { user_id: decoded.sub },
        include: { user_roles: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = {
        id: user.user_id,
        email: user.email,
        fullName: user.full_name,
        roles: user.user_roles.map(r => r.role)
      };

      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.user.fullName} (${socket.id})`);

    // Track connected user
    connectedUsers.set(socket.user.id, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });

    // Join user-specific room
    socket.join(`user:${socket.user.id}`);

    // Join role-based rooms
    socket.user.roles.forEach(role => {
      socket.join(`role:${role}`);
    });

    // ==========================================
    // CHAT HANDLERS
    // ==========================================

    socket.on('chat:join', async (roomId: string) => {
      try {
        // Verify user is participant of the room
        const participant = await prisma.chat_participants.findFirst({
          where: {
            room_id: roomId,
            user_id: socket.user.id
          }
        });

        if (!participant) {
          socket.emit('error', { message: 'Not a participant of this room' });
          return;
        }

        socket.join(`chat:${roomId}`);
        socket.emit('chat:joined', { roomId });

        // Update last read
        await prisma.chat_participants.update({
          where: { id: participant.id },
          data: { last_read_at: new Date() }
        });
      } catch (error) {
        console.error('Chat join error:', error);
        socket.emit('error', { message: 'Failed to join chat room' });
      }
    });

    socket.on('chat:message', async (data: ChatMessageData) => {
      try {
        const { roomId, content, messageType = 'text' } = data;

        // Save message to database
        const message = await prisma.chat_messages.create({
          data: {
            room_id: roomId,
            sender_id: socket.user.id,
            content,
            message_type: messageType
          },
          include: {
            profiles: {
              select: {
                full_name: true,
                avatar_url: true
              }
            }
          }
        });

        // Broadcast to room
        io.to(`chat:${roomId}`).emit('chat:message', {
          id: message.id,
          roomId: message.room_id,
          senderId: message.sender_id,
          senderName: message.profiles?.full_name,
          senderAvatar: message.profiles?.avatar_url,
          content: message.content,
          messageType: message.message_type,
          createdAt: message.created_at
        });

        // Update room's updated_at
        await prisma.chat_rooms.update({
          where: { id: roomId },
          data: { updated_at: new Date() }
        });
      } catch {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('chat:typing', (roomId: string) => {
      socket.to(`chat:${roomId}`).emit('chat:typing', {
        userId: socket.user.id,
        userName: socket.user.fullName
      });
    });

    socket.on('chat:leave', (roomId: string) => {
      socket.leave(`chat:${roomId}`);
    });

    // ==========================================
    // NOTIFICATION HANDLERS
    // ==========================================

    socket.on('notification:subscribe', () => {
      // Already subscribed via user room
      console.log(`User ${socket.user.id} subscribed to notifications`);
    });

    // ==========================================
    // QUEUE HANDLERS
    // ==========================================

    socket.on('queue:subscribe', (departmentId: string) => {
      socket.join(`queue:${departmentId}`);
      console.log(`User ${socket.user.id} subscribed to queue:${departmentId}`);
    });

    socket.on('queue:unsubscribe', (departmentId: string) => {
      socket.leave(`queue:${departmentId}`);
    });

    // ==========================================
    // ICU MONITORING HANDLERS
    // ==========================================

    socket.on('icu:subscribe', (bedId: string) => {
      if (socket.user.roles.includes('icu') || socket.user.roles.includes('dokter') || socket.user.roles.includes('admin')) {
        socket.join(`icu:${bedId}`);
      }
    });

    socket.on('icu:vital-update', async (data: IcuVitalData) => {
      // Only ICU staff, doctors, and admins may push vital-sign updates
      const authorizedRoles = ['icu', 'dokter', 'admin'];
      const hasRole = socket.user.roles.some(r => authorizedRoles.includes(r));
      if (!hasRole) {
        socket.emit('error', { message: 'Tidak memiliki izin untuk event ini', code: 'FORBIDDEN' });
        return;
      }
      const { bedId, vitalSigns } = data;

      // Broadcast to ICU monitoring room
      io.to(`icu:${bedId}`).emit('icu:vitals', {
        bedId,
        vitalSigns,
        timestamp: new Date()
      });
    });

    // ==========================================
    // DISCONNECT HANDLER
    // ==========================================

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.fullName} (${socket.id})`);
      connectedUsers.delete(socket.user.id);
    });
  });

  // ==========================================
  // SERVER-SIDE BROADCAST FUNCTIONS
  // ==========================================

  /**
   * Send notification to specific user
   */
  io.sendNotification = (userId: string, notification: unknown) => {
    io.to(`user:${userId}`).emit('notification', notification);
  };

  /**
   * Send notification to all users with specific role
   */
  io.sendRoleNotification = (role: string, notification: unknown) => {
    io.to(`role:${role}`).emit('notification', notification);
  };

  /**
   * Broadcast queue update
   */
  io.broadcastQueueUpdate = (departmentId: string, queueData: unknown) => {
    io.to(`queue:${departmentId}`).emit('queue:update', queueData);
  };

  /**
   * Broadcast bed status update
   */
  io.broadcastBedUpdate = (bedData: unknown) => {
    io.emit('bed:update', bedData);
  };

  /**
   * Get online users count
   */
  io.getOnlineUsers = () => {
    return connectedUsers.size;
  };

  /**
   * Get online users by role
   */
  io.getOnlineUsersByRole = (role: string) => {
    return Array.from(connectedUsers.values())
      .filter(u => u.user.roles.includes(role));
  };

  return io;
}

export { connectedUsers };
