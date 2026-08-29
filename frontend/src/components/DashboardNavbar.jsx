import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useInstructorAuth } from '../contexts/InstructorAuthContext'

function DashboardNavbar({ title, userEmail, onLogout, showProfileButtons = true }) {
  const navigate = useNavigate()
  const { logout } = useInstructorAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {userEmail && <span className="text-sm text-gray-600 dark:text-gray-400">{userEmail}</span>}
            {showProfileButtons && (
              <>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Profile
                </button>
                 <button
                  onClick={handleLogout}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Logout
                </button>
              </>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default DashboardNavbar
