import { Navigate } from 'react-router-dom'
import { useInstructorAuth } from '../contexts/InstructorAuthContext'

const InstructorProtectedRoute = ({ children }) => {
  const { user, loading } = useInstructorAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/instructor/login" replace />
  }

  return children
}

export default InstructorProtectedRoute
