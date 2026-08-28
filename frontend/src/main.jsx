import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { InstructorAuthProvider } from './contexts/InstructorAuthContext'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <InstructorAuthProvider>
          <App />
        </InstructorAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)