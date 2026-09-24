import type { Server as SocketIOServer } from 'socket.io';

export const sessionRoom = (sessionId: string) => `session_${sessionId}`;
export const professorRoom = (sessionId: string) => `session_${sessionId}_professor`;
export const studentsRoom = (sessionId: string) => `session_${sessionId}_students`;

let io: SocketIOServer | null = null;

export const setIO = (instance: SocketIOServer) => {
  io = instance;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const emitToSession = (sessionId: string, event: string, data: unknown) => {
  if (!io) return;
  io.to(sessionRoom(sessionId)).emit(event, data);
};

export const emitToProfessor = (sessionId: string, event: string, data: unknown) => {
  if (!io) return;
  io.to(professorRoom(sessionId)).emit(event, data);
};

export const emitToStudents = (sessionId: string, event: string, data: unknown) => {
  if (!io) return;
  io.to(studentsRoom(sessionId)).emit(event, data);
};
