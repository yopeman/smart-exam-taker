import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AdminLogin from './pages/admin/AdminLogin'
import RegisteredSchoolsList from './pages/admin/RegisteredSchoolsList'
import AdminProtectedRoute from './pages/admin/AdminProtectedRoute'
import InstructorProtectedRoute from './components/InstructorProtectedRoute'

import ExamPortal from './pages/public/ExamPortal'
import TakeExam from './pages/public/TakeExam'

import AdminDashboard from './pages/admin/Dashboard'

import InstructorLogin from './pages/instructor/Login'
import InstructorDashboard from './pages/instructor/Dashboard'
import InstructorOverview from './pages/instructor/Overview'
import SchoolsManagement from './pages/instructor/SchoolsManagement'
import UsersManagement from './pages/instructor/UsersManagement'
import ExamsList from './pages/instructor/ExamsList'
import CreateExam from './pages/instructor/CreateExam'

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/exam" element={<ExamPortal />} />
      <Route path="/exam/:examId" element={<TakeExam />} />

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

      {/* Instructor — backend JWT auth */}
      <Route path="/login" element={<InstructorLogin />} />
      <Route
        path="/instructor"
        element={
          <InstructorProtectedRoute>
            <InstructorDashboard />
          </InstructorProtectedRoute>
        }
      />
      <Route
        path="/instructor/overview"
        element={
          <InstructorProtectedRoute>
            <InstructorOverview />
          </InstructorProtectedRoute>
        }
      />
      <Route
        path="/instructor/schools"
        element={
          <InstructorProtectedRoute>
            <SchoolsManagement />
          </InstructorProtectedRoute>
        }
      />
      <Route
        path="/instructor/users"
        element={
          <InstructorProtectedRoute>
            <UsersManagement />
          </InstructorProtectedRoute>
        }
      />
      <Route
        path="/instructor/exams"
        element={
          <InstructorProtectedRoute>
            <ExamsList />
          </InstructorProtectedRoute>
        }
      />
      <Route
        path="/instructor/create"
        element={
          <InstructorProtectedRoute>
            <CreateExam />
          </InstructorProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App