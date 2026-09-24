import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Toast, type ToastType } from '../components/ui/Toast';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const success = useCallback((message: string, duration?: number) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message: string, duration?: number) => addToast(message, 'error', duration), [addToast]);
  const info = useCallback((message: string, duration?: number) => addToast(message, 'info', duration), [addToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const contextValue = React.useMemo(() => ({
    addToast, success, error, info
  }), [addToast, success, error, info]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 9999,
      }}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
