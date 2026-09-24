/**
 * Socket.IO entry — re-exports modular implementation under ./socket/
 * (sessionRooms, socketAuth, initSocket).
 */
export {
  initSocket,
  getIO,
  emitToSession,
  emitToProfessor,
  emitToStudents,
} from './socket/index';
