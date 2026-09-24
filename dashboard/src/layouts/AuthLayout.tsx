import React from 'react';
import { Outlet } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import './AuthLayout.css';

export const AuthLayout: React.FC = () => {
  return (
    <div className="auth-layout">
      <div className="auth-sidebar">
        <div className="auth-brand">
          <Terminal size={40} className="auth-logo" />
          <h1 className="auth-title">CodeTrack</h1>
        </div>
        <p className="auth-subtitle">
          Real-time classroom monitoring and progressive assistance for computer science labs.
        </p>
        
        <div className="auth-illustration">
          {/* Abstract aesthetic pattern */}
          <div className="abstract-shape shape-1"></div>
          <div className="abstract-shape shape-2"></div>
          <div className="abstract-shape shape-3"></div>
        </div>
      </div>
      
      <div className="auth-content animate-fade">
        <Outlet />
      </div>
    </div>
  );
};
