import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './components/Login'
import SchoolsList from './components/SchoolsList'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/schools"
        element={
          <ProtectedRoute>
            <SchoolsList />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App