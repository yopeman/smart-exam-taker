import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/public/LandingPage'
import AdminLogin from './pages/admin/sb/AdminLogin'
import RegisteredSchoolsList from './pages/admin/sb/RegisteredSchoolsList'
import AdminProtectedRoute from './pages/admin/sb/AdminProtectedRoute'

import AdminDashboard from './pages/admin/Dashboard'

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />

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
  )
}

export default App