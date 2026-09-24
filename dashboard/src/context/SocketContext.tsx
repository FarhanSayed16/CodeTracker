import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '../services/socketService';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(socketService.getSocket());
  const [isConnected, setIsConnected] = useState(socketService.isConnected());

  // Keep React state in sync with the shared socketService (fixes refresh race)
  useEffect(() => {
    return socketService.subscribe((nextSocket, connected) => {
      setSocket(nextSocket);
      setIsConnected(connected);
    });
  }, []);

  // Ensure a socket exists whenever we have a professor token
  useEffect(() => {
    if (!token) {
      socketService.disconnect();
      return;
    }
    if (!socketService.getSocket()) {
      socketService.connect(token);
    }
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
