import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, Calendar, Plus, Building2, UserPlus, ClipboardList } from 'lucide-react'
import DashboardNavbar from '../../components/DashboardNavbar'

function InstructorDashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar title="Instructor Dashboard" />

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, Instructor</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your exams and track student progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Exams</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
              <BookOpen className="h-10 w-10 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Students</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
              <Users className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Exams</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => navigate('/instructor/schools')}
            className="flex items-center gap-3 rounded-lg bg-white p-4 text-left shadow hover:ring-2 hover:ring-indigo-500 dark:bg-gray-800"
          >
            <Building2 className="h-6 w-6 text-indigo-600" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Manage Schools</p>
              <p className="text-sm text-gray-500">Create and organize your institutions</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/instructor/invitations')}
            className="flex items-center gap-3 rounded-lg bg-white p-4 text-left shadow hover:ring-2 hover:ring-indigo-500 dark:bg-gray-800"
          >
            <UserPlus className="h-6 w-6 text-indigo-600" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Invitations</p>
              <p className="text-sm text-gray-500">Invite instructors or respond to invites</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/instructor/exams')}
            className="flex items-center gap-3 rounded-lg bg-white p-4 text-left shadow hover:ring-2 hover:ring-indigo-500 dark:bg-gray-800"
          >
            <BookOpen className="h-6 w-6 text-indigo-600" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Manage Exams</p>
              <p className="text-sm text-gray-500">Create and run digital exams</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/instructor/attempts')}
            className="flex items-center gap-3 rounded-lg bg-white p-4 text-left shadow hover:ring-2 hover:ring-indigo-500 dark:bg-gray-800"
          >
            <ClipboardList className="h-6 w-6 text-indigo-600" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Attempts</p>
              <p className="text-sm text-gray-500">Review student submissions</p>
            </div>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Exams</h3>
            <button
            onClick={() => navigate('/instructor/exams')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5" />
            Create Exam
          </button>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No exams created yet</p>
        </div>
      </main>
    </div>
  )
}

export default InstructorDashboard
