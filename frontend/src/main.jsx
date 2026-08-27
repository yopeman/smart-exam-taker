import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import App from './App.jsx'
import Login from './components/Login'
import SchoolsList from './components/SchoolsList'
import ProtectedRoute from './components/ProtectedRoute'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
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
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
