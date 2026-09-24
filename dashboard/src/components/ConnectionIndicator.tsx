import React from 'react';
import { clsx } from 'clsx';
import { useSocket } from '../context/SocketContext';
import { Wifi, WifiOff } from 'lucide-react';
import './ConnectionIndicator.css';

export const ConnectionIndicator: React.FC = () => {
  const { isConnected } = useSocket();

  return (
    <div
      className={clsx('connection-indicator', {
        'connection-connected': isConnected,
        'connection-disconnected': !isConnected,
      })}
    >
      {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
      <span className="connection-text">
        {isConnected ? 'Connected' : 'Reconnecting...'}
      </span>
    </div>
  );
};
