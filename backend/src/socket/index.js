/**
 * SIMRS ZEN - Socket.IO Configuration
 * Real-time features: Chat, Notifications, Queue Updates
 * 
 * WebSocket event subscriptions
 */

import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Store connected users
const connectedUsers = new Map();

/**
 * Initialize Socket.IO Handlers
 */
export function initializeSocketHandlers(io) {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      
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
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
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

    socket.on('chat:join', async (roomId) => {
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

    socket.on('chat:message', async (data) => {
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
      } catch (error) {
        console.error('Chat message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('chat:typing', (roomId) => {
      socket.to(`chat:${roomId}`).emit('chat:typing', {
        userId: socket.user.id,
        userName: socket.user.fullName
      });
    });

    socket.on('chat:leave', (roomId) => {
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

    socket.on('queue:subscribe', (departmentId) => {
      socket.join(`queue:${departmentId}`);
      console.log(`User ${socket.user.id} subscribed to queue:${departmentId}`);
    });

    socket.on('queue:unsubscribe', (departmentId) => {
      socket.leave(`queue:${departmentId}`);
    });

    // ==========================================
    // ICU MONITORING HANDLERS
    // ==========================================

    socket.on('icu:subscribe', (bedId) => {
      if (socket.user.roles.includes('icu') || socket.user.roles.includes('dokter') || socket.user.roles.includes('admin')) {
        socket.join(`icu:${bedId}`);
      }
    });

    socket.on('icu:vital-update', async (data) => {
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
  io.sendNotification = (userId, notification) => {
    io.to(`user:${userId}`).emit('notification', notification);
  };

  /**
   * Send notification to all users with specific role
   */
  io.sendRoleNotification = (role, notification) => {
    io.to(`role:${role}`).emit('notification', notification);
  };

  /**
   * Broadcast queue update
   */
  io.broadcastQueueUpdate = (departmentId, queueData) => {
    io.to(`queue:${departmentId}`).emit('queue:update', queueData);
  };

  /**
   * Broadcast bed status update
   */
  io.broadcastBedUpdate = (bedData) => {
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
  io.getOnlineUsersByRole = (role) => {
    return Array.from(connectedUsers.values())
      .filter(u => u.user.roles.includes(role));
  };

  return io;
}

export { connectedUsers };
