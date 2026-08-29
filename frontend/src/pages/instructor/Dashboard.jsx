import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, Calendar, Plus } from 'lucide-react'
import DashboardNavbar from '../../components/DashboardNavbar'

function InstructorDashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar title="Instructor Dashboard" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome, Instructor</h2>
          <p className="text-gray-600">Manage your exams and track student progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Exams</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <BookOpen className="h-10 w-10 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Students</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <Users className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Exams</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Exams</h3>
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              <Plus className="h-5 w-5" />
              Create Exam
            </button>
          </div>
          <p className="text-gray-500 text-center py-8">No exams created yet</p>
        </div>
      </main>
    </div>
  )
}

export default InstructorDashboard
