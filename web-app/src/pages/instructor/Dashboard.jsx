import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, Calendar, Plus, Building2, UserPlus, ClipboardList } from 'lucide-react'
import DashboardNavbar from '../../components/DashboardNavbar'

function InstructorDashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar title="Instructor Dashboard" />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome, Instructor</h2>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage your exams and track student progress</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => navigate('/instructor/schools')}
            className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-gray-700 dark:text-indigo-400">
              <Building2 className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Manage Schools</p>
              <p className="mt-1 text-sm text-gray-500">Create and organize your institutions</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/instructor/invitations')}
            className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-gray-700 dark:text-indigo-400">
              <UserPlus className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Invitations</p>
              <p className="mt-1 text-sm text-gray-500">Invite instructors or respond to invites</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/instructor/exams')}
            className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-gray-700 dark:text-indigo-400">
              <BookOpen className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Manage Exams</p>
              <p className="mt-1 text-sm text-gray-500">Create and run digital exams</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/instructor/attempts')}
            className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-gray-700 dark:text-indigo-400">
              <ClipboardList className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Attempts</p>
              <p className="mt-1 text-sm text-gray-500">Review student submissions</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  )
}

export default InstructorDashboard
