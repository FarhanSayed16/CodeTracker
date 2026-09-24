import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { HomePage } from './pages/dashboard/HomePage';
import { ClassesListPage } from './pages/dashboard/ClassesListPage';
import { ClassDetailPage } from './pages/dashboard/ClassDetailPage';

import { SessionDashboardPage } from './pages/dashboard/SessionDashboardPage';
import { SessionSummaryPage } from './pages/dashboard/SessionSummaryPage';
import { HistoryPage } from './pages/dashboard/HistoryPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { CreateSessionPage } from './pages/dashboard/CreateSessionPage';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/classes" element={<ClassesListPage />} />
                  <Route path="/classes/:id" element={<ClassDetailPage />} />
                  <Route path="/sessions/new" element={<CreateSessionPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/sessions/:id/summary" element={<SessionSummaryPage />} />
                </Route>
                <Route path="/sessions/:id" element={<SessionDashboardPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
