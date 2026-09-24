import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { getIO, sessionRoom, studentsRoom } from './sessionRooms';
import { logger } from '../utils/logger';

export type SocketUser =
  | { professorId: string; email?: string; name?: string }
  | { studentId: string; sessionId: string; rollNo?: string; name?: string };

/** Disconnect other sockets for the same student+session (phone vs companion, etc.). */
async function kickOtherStudentSockets(socket: Socket, studentId: string, sessionId: string) {
  try {
    const io = getIO();
    const others = await io.fetchSockets();
    for (const s of others) {
      if (s.id === socket.id) continue;
      const u = s.data.user as SocketUser | undefined;
      if (u && 'studentId' in u && u.studentId === studentId && u.sessionId === sessionId) {
        s.emit('session-taken-over', { reason: 'joined_elsewhere' });
        s.disconnect(true);
        logger.info({ studentId, sessionId, oldSocket: s.id }, 'Student session taken over by new connection');
      }
    }
  } catch (err) {
    logger.warn({ err }, 'kickOtherStudentSockets failed');
  }
}

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as SocketUser;
    socket.data.user = decoded;

    if ('studentId' in decoded && decoded.sessionId) {
      socket.join(sessionRoom(decoded.sessionId));
      socket.join(studentsRoom(decoded.sessionId));
      // Fire-and-forget: only one live student client per session
      void kickOtherStudentSockets(socket, decoded.studentId, decoded.sessionId);
    }

    next();
  } catch {
    return next(new Error('Authentication error: Invalid token'));
  }
};
