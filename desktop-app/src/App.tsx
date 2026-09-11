import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './lib/theme/theme';
import { useAuthStore } from './store/authStore';
import Login from './screens/auth/Login';
import Register from './screens/auth/Register';
import ForgotPassword from './screens/auth/ForgotPassword';
import ResetPassword from './screens/auth/ResetPassword';
import Dashboard from './screens/student/Dashboard';
import Profile from './screens/student/Profile';
import Exams from './screens/student/Exams';
import ExamDetail from './screens/student/ExamDetail';
import TakeExam from './screens/student/TakeExam';
import Attempts from './screens/student/Attempts';

function AuthGate() {
  const { isAuthenticated, loadUser } = useAuthStore();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    loadUser().then(() => setHasChecked(true));
  }, [loadUser]);

  if (!hasChecked) {
    return (
      <div className="auth-screen">
        <div className="center">
          <span className="button__spinner" style={{ width: 28, height: 28 }} />
          <p className="center__text">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<AuthGate />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="/exams"
            element={
              <RequireAuth>
                <Exams />
              </RequireAuth>
            }
          />
          <Route
            path="/exams/:id"
            element={
              <RequireAuth>
                <ExamDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/exams/:id/take"
            element={
              <RequireAuth>
                <TakeExam />
              </RequireAuth>
            }
          />
          <Route
            path="/attempts"
            element={
              <RequireAuth>
                <Attempts />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}