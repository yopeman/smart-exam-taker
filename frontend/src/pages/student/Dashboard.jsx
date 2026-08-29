import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, CheckCircle, Play } from 'lucide-react'
import DashboardNavbar from '../../components/DashboardNavbar'

function StudentDashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar title="Student Dashboard" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome, Student</h2>
          <p className="text-gray-600">View your assigned exams and track your progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assigned Exams</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <BookOpen className="h-10 w-10 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <Clock className="h-10 w-10 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Available Exams</h3>
          </div>
          <p className="text-gray-500 text-center py-8">No exams assigned yet</p>
        </div>
      </main>
    </div>
  )
}

export default StudentDashboard
