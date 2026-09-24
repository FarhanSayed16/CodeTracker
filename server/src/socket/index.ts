import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';
import { corsOriginOption } from '../config/corsOrigins';
import { prisma } from '../config/database';
import { socketAuthMiddleware } from './socketAuth';
import { setIO, sessionRoom, professorRoom, getIO, emitToSession, emitToProfessor, emitToStudents } from './sessionRooms';

export const initSocket = (httpServer: HttpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOriginOption(),
      credentials: true,
    },
  });

  setIO(io);
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const user = socket.data.user;
    logger.info(
      `Socket connected: ${socket.id} (User: ${user?.name || user?.professorId || user?.studentId})`
    );

    socket.on('join-session', async (sessionId: string) => {
      try {
        if (!user?.professorId) {
          socket.emit('error', { message: 'Only professors can join session rooms this way' });
          return;
        }

        if (!sessionId || typeof sessionId !== 'string') {
          socket.emit('error', { message: 'Invalid sessionId' });
          return;
        }

        const session = await prisma.session.findUnique({
          where: { id: sessionId },
          include: { class: true },
        });

        if (!session || session.class.professorId !== user.professorId) {
          socket.emit('error', { message: 'Forbidden: you do not own this session' });
          logger.warn(`Professor ${user.professorId} denied join-session for ${sessionId}`);
          return;
        }

        socket.join(sessionRoom(sessionId));
        socket.join(professorRoom(sessionId));
        logger.info(`Professor ${user.professorId} joined room ${sessionRoom(sessionId)}`);
      } catch (err) {
        logger.error({ err }, 'join-session failed');
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export { getIO, emitToSession, emitToProfessor, emitToStudents };
