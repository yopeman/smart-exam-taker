import { Navigate } from 'react-router-dom'
import { getToken } from '../lib/apiClient'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = getToken()
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  // If allowedRoles is specified, check user role
  if (allowedRoles.length > 0) {
    // Decode token to get user role
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userRole = payload.role
      
      if (!allowedRoles.includes(userRole)) {
        // User doesn't have required role, redirect to appropriate dashboard
        if (userRole === 'admin') {
          return <Navigate to="/admin/sb" replace />
        } else if (userRole === 'instructor') {
          return <Navigate to="/instructor/dashboard" replace />
        } else if (userRole === 'student') {
          return <Navigate to="/student/dashboard" replace />
        }
        return <Navigate to="/login" replace />
      }
    } catch (error) {
      console.error('Error decoding token:', error)
      return <Navigate to="/login" replace />
    }
  }
  
  return children
}

export default ProtectedRoute
