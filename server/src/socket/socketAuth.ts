import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sessionRoom, studentsRoom } from './sessionRooms';

export type SocketUser =
  | { professorId: string; email?: string; name?: string }
  | { studentId: string; sessionId: string; rollNo?: string; name?: string };

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
    }

    next();
  } catch {
    return next(new Error('Authentication error: Invalid token'));
  }
};
