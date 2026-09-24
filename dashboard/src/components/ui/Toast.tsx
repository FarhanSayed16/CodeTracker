import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // match animation duration
  };

  const icons = {
    success: <CheckCircle2 className="toast-icon toast-icon-success" size={20} />,
    error: <XCircle className="toast-icon toast-icon-error" size={20} />,
    info: <Info className="toast-icon toast-icon-info" size={20} />,
  };

  return (
    <div
      className={clsx('toast', `toast-${type}`, {
        'animate-slide-right': !isClosing,
        'animate-fade-out': isClosing,
      })}
    >
      <div className="toast-content">
        {icons[type]}
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={handleClose}>
        <X size={16} />
      </button>
      {duration > 0 && (
        <div 
          className="toast-progress" 
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
};
