import { useState, useEffect, useMemo } from 'react'
import { apiClient } from '../../lib/apiClient'
import DashboardNavbar from '../../components/DashboardNavbar'
import { ClipboardList, User as UserIcon, ChevronRight, X } from 'lucide-react'

const ATTEMPT_STATUS_STYLES = {
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  processing: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  graded: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

function AttemptStatusBadge({ status }) {
  const style = ATTEMPT_STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  )
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString()
}

function AttemptDetail({ attempt, exam, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Attempt Details
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {exam?.title || 'Unknown exam'}{' '}
              <span className="text-xs text-gray-500">({exam?.code})</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-700/40">
            <div>
              <p className="text-xs text-gray-500">Student</p>
              <p className="text-gray-900 dark:text-white">
                {attempt.student_first_name} {attempt.student_last_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">ID Number</p>
              <p className="text-gray-900 dark:text-white">{attempt.student_id_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p className="text-gray-900 dark:text-white">{attempt.department || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Year / Semester / Section</p>
              <p className="text-gray-900 dark:text-white">
                {attempt.year_of_study || '—'} / {attempt.semester || '—'} /{' '}
                {attempt.section || '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md bg-gray-50 p-2 dark:bg-gray-700/40">
              <p className="text-xs text-gray-500">Objective</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {attempt.objective_score}
              </p>
            </div>
            <div className="rounded-md bg-gray-50 p-2 dark:bg-gray-700/40">
              <p className="text-xs text-gray-500">AI</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {attempt.ai_score}
              </p>
            </div>
            <div className="rounded-md bg-gray-50 p-2 dark:bg-gray-700/40">
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {attempt.total_score}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs text-gray-500">Timeline</p>
            <p className="text-gray-900 dark:text-white">
              Started: {formatDate(attempt.started_at)}
            </p>
            <p className="text-gray-900 dark:text-white">
              Submitted: {formatDate(attempt.submitted_at)}
            </p>
            <p className="text-gray-900 dark:text-white">
              Graded: {formatDate(attempt.graded_at)}
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs text-gray-500">Answers</p>
            <pre className="max-h-60 overflow-auto rounded-md bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-700/40 dark:text-gray-200">
              {JSON.stringify(attempt.answers, null, 2)}
            </pre>
          </div>

          {attempt.grading_details != null && (
            <div>
              <p className="mb-1 text-xs text-gray-500">Grading Details</p>
              <pre className="max-h-60 overflow-auto rounded-md bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-700/40 dark:text-gray-200">
                {JSON.stringify(attempt.grading_details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Attempts() {
  const [attempts, setAttempts] = useState([])
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterExam, setFilterExam] = useState('')
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([apiClient.get('/attempts/reachable'), apiClient.get('/exams/reachable')])
      .then(([atts, exs]) => {
        setAttempts(atts)
        setExams(exs)
      })
      .catch((err) => setError(err.message || 'Failed to load attempts'))
      .finally(() => setLoading(false))
  }, [])

  const examMap = useMemo(() => {
    const m = {}
    exams.forEach((e) => {
      m[e.id] = e
    })
    return m
  }, [exams])

  const filtered = useMemo(() => {
    if (!filterExam) return attempts
    return attempts.filter((a) => a.exam_id === filterExam)
  }, [attempts, filterExam])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar title="Attempts" />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attempts</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Student submissions across all exams you can manage
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Exam
          </label>
          <select
            value={filterExam}
            onChange={(e) => setFilterExam(e.target.value)}
            className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All exams</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.code})
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg bg-white py-12 text-center shadow dark:bg-gray-800">
            <ClipboardList className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">No attempts found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => {
              const exam = examMap[a.exam_id]
              return (
                <button
                  key={a.id}
                  onClick={() => setDetail(a)}
                  className="flex w-full items-center gap-4 rounded-lg bg-white p-4 text-left shadow hover:ring-2 hover:ring-indigo-500 dark:bg-gray-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900 dark:text-white">
                      {exam?.title || 'Unknown exam'}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <UserIcon className="h-3 w-3" />
                      {a.student_first_name} {a.student_last_name} · {a.student_id_number}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>{exam?.code}</span>
                      {a.department && <span>{a.department}</span>}
                      {a.section && <span>Sec {a.section}</span>}
                      <span>
                        Score: {a.total_score} ({a.objective_score}+{a.ai_score})
                      </span>
                    </div>
                  </div>
                  <AttemptStatusBadge status={a.status} />
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              )
            })}
          </div>
        )}
      </main>

      {detail && (
        <AttemptDetail
          attempt={detail}
          exam={examMap[detail.exam_id]}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  )
}
