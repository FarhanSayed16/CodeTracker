import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '') || 'http://localhost:3000';

type Listener = (socket: Socket | null, connected: boolean) => void;

let socket: Socket | null = null;
const listeners = new Set<Listener>();

function notify() {
  const connected = !!socket?.connected;
  listeners.forEach((fn) => fn(socket, connected));
}

export const socketService = {
  connect(token: string) {
    if (socket) {
      // Reuse existing connection if same token / already connected
      if (socket.connected && (socket.auth as { token?: string })?.token === token) {
        notify();
        return socket;
      }
      this.disconnect();
    }

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
      notify();
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      notify();
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      notify();
    });

    // In case connect is already in flight
    notify();
    return socket;
  },

  disconnect() {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
      notify();
    }
  },

  getSocket(): Socket | null {
    return socket;
  },

  isConnected(): boolean {
    return !!socket?.connected;
  },

  /** Subscribe to connection changes (connect / disconnect / new instance). */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    listener(socket, !!socket?.connected);
    return () => {
      listeners.delete(listener);
    };
  },

  joinSession(sessionId: string) {
    if (socket?.connected) {
      socket.emit('join-session', sessionId);
    }
  },
};
