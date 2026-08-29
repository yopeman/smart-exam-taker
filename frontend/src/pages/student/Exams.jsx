import { useEffect, useState } from 'react'
import { apiClient } from '../../lib/apiClient'
import DashboardNavbar from '../../components/DashboardNavbar'
import { BookOpen, Clock, Building2, User as UserIcon } from 'lucide-react'

const STATUS_STYLES = {
  processing: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  started: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  )
}

export default function Exams() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    apiClient
      .get('/exams/available')
      .then((data) => setExams(data))
      .catch((err) => setError(err.message || 'Failed to load exams'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar title="My Exams" />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Available Exams</h2>
          <p className="text-gray-600 dark:text-gray-400">Exams assigned to you</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : exams.length === 0 ? (
          <div className="rounded-lg bg-white py-12 text-center shadow dark:bg-gray-800">
            <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">No exams assigned yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="rounded-lg bg-white p-4 shadow dark:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">
                        {exam.title}
                      </p>
                      <StatusBadge status={exam.status} />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Code: {exam.code}</p>
                  </div>
                  {exam.school?.logo_url && (
                    <img
                      src={exam.school.logo_url}
                      alt={exam.school.name}
                      className="h-10 w-10 rounded-md object-contain"
                    />
                  )}
                </div>

                {exam.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {exam.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                  {exam.department && <span>{exam.department}</span>}
                  {exam.year_of_study && <span>Year {exam.year_of_study}</span>}
                  {exam.semester && <span>{exam.semester}</span>}
                  {exam.section && <span>Sec {exam.section}</span>}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {exam.duration_minutes}m
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-700">
                  {exam.school && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> {exam.school.name}
                    </span>
                  )}
                  {exam.instructor && (
                    <span className="flex items-center gap-1">
                      <UserIcon className="h-3 w-3" /> {exam.instructor.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
