import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { getToken } from '../lib/apiClient'
import { apiFetch } from '../lib/apiClient'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = getToken()
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchUserRole() {
      if (!token) {
        setError(true)
        setIsLoading(false)
        return
      }

      // If no role restrictions, allow access
      if (allowedRoles.length === 0) {
        setIsLoading(false)
        return
      }

      try {
        const response = await apiFetch('/auth/me')
        setUserRole(response.role)
      } catch (err) {
        console.error('Error fetching user profile:', err)
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserRole()
  }, [token, allowedRoles])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!token || error) {
    return <Navigate to="/login" replace />
  }

  // If allowedRoles is specified, check user role
  if (allowedRoles.length > 0 && userRole) {
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
  }

  return children
}

export default ProtectedRoute
