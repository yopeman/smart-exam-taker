import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import LandingPage from './pages/public/LandingPage'
import ProfilePage from './pages/Profile'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import VerifyEmailPage from './pages/public/VerifyEmailPage'
import ForgotPasswordPage from './pages/public/ForgotPasswordPage'
import ResetPasswordPage from './pages/public/ResetPasswordPage'
import AdminDashboard from './pages/admin/Dashboard'
import InstructorDashboard from './pages/instructor/Dashboard'
import Schools from './pages/instructor/Schools'
import Exams from './pages/instructor/Exams'
import Attempts from './pages/instructor/Attempts'
import Invitations from './pages/instructor/Invitations'
import StudentDashboard from './pages/student/Dashboard'
import StudentExams from './pages/student/Exams'
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

      {/* Profile — any authenticated user */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Instructor */}
      <Route
        path="/instructor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <InstructorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/schools"
        element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <Schools />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/invitations"
        element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <Invitations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/exams"
        element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <Exams />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/attempts"
        element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <Attempts />
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
      <Route
        path="/student/exams"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentExams />
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