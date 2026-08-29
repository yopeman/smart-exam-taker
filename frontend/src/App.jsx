import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import VerifyEmailPage from './pages/public/VerifyEmailPage'
import ForgotPasswordPage from './pages/public/ForgotPasswordPage'
import ResetPasswordPage from './pages/public/ResetPasswordPage'
import AdminDashboard from './pages/admin/Dashboard'
import InstructorDashboard from './pages/instructor/Dashboard'
import StudentDashboard from './pages/student/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLogin from './pages/admin/sb/AdminLogin'
import RegisteredSchoolsList from './pages/admin/sb/RegisteredSchoolsList'
import AdminProtectedRoute from './pages/admin/sb/AdminProtectedRoute'

function App() {
  return (
    <ThemeProvider>
      <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      {/* Instructor */}
      <Route
        path="/instructor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <InstructorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Student */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin — Supabase auth; subscription & overall system management */}
      <Route path="/admin/sb/login" element={<AdminLogin />} />
      <Route
        path="/admin/sb"
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/sb/schools"
        element={
          <AdminProtectedRoute>
            <RegisteredSchoolsList />
          </AdminProtectedRoute>
        }
      />
    </Routes>
    </ThemeProvider>
  )
}

export default App