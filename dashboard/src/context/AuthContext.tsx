import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, type Professor } from '../services/authService';
import { socketService } from '../services/socketService';

interface AuthContextType {
  professor: Professor | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, professor: Professor) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const professor = await authService.getMe();
          setProfessor(professor);
          socketService.connect(token);
        } catch (error) {
          console.error('Failed to verify token', error);
          authService.logout();
          setToken(null);
          setProfessor(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = (newToken: string, newProfessor: Professor) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setProfessor(newProfessor);
    socketService.connect(newToken);
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setProfessor(null);
    socketService.disconnect();
  };

  return (
    <AuthContext.Provider value={{ professor, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
