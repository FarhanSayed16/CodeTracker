import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Terminal,
  LayoutDashboard,
  Users,
  Settings,
  Menu,
  X,
  History,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { Dropdown } from '../components/ui/Dropdown';
import { clsx } from 'clsx';
import './DashboardLayout.css';

export const DashboardLayout: React.FC = () => {
  const { professor, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'classes', label: 'Classes', icon: Users, path: '/classes' },
    { id: 'history', label: 'History', icon: History, path: '/history' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/history' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isItemActive = (id: string, path: string) => {
    if (path === '/') return location.pathname === '/';
    if (id === 'history' || id === 'analytics') return location.pathname.startsWith('/history');
    return location.pathname.startsWith(path);
  };

  return (
    <div className="dashboard-layout">
      <aside className={clsx('dashboard-sidebar', { 'sidebar-open': isMobileMenuOpen })}>
        <div className="sidebar-header">
          <Terminal size={32} className="sidebar-logo" />
          <h2 className="sidebar-title">CodeTrack</h2>
          <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              className={clsx('nav-item', { 'nav-active': isItemActive(item.id, item.path) })}
              onClick={() => setIsMobileMenuOpen(false)}
              title={item.label}
            >
              <item.icon size={20} />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <ConnectionIndicator />
          </div>

          <div className="topbar-right">
            <Dropdown
              align="right"
              trigger={
                <div className="user-profile-trigger">
                  <div className="avatar">{professor?.name.charAt(0).toUpperCase()}</div>
                  <span className="user-name">{professor?.name}</span>
                </div>
              }
              items={[
                { id: 'profile', label: 'Profile', onClick: () => navigate('/settings') },
                { id: 'logout', label: 'Logout', destructive: true, onClick: handleLogout },
              ]}
            />
          </div>
        </header>

        <main className="dashboard-content animate-fade">
          <Outlet />
        </main>
      </div>

      {isMobileMenuOpen && (
        <div className="mobile-overlay animate-fade" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
};
