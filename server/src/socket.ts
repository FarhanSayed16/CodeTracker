import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { env } from './config/env';
import { logger } from './utils/logger';
import jwt from 'jsonwebtoken';

let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      socket.data.user = decoded;
      
      // If student, they have sessionId in their token. Let's auto-join them to the session room.
      if (decoded.studentId && decoded.sessionId) {
        socket.join(`session_${decoded.sessionId}`);
      }

      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.data.user.name || socket.data.user.professorId || socket.data.user.studentId})`);

    // Professor can manually request to join a room for a session they are viewing
    socket.on('join-session', (sessionId: string) => {
      // Basic check: if it's a professor, they can join any session room to listen to events
      if (socket.data.user.professorId) {
        socket.join(`session_${sessionId}`);
        logger.info(`Professor ${socket.data.user.professorId} joined room session_${sessionId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
