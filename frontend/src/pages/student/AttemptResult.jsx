import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiClient } from '../../lib/apiClient'
import DashboardNavbar from '../../components/DashboardNavbar'
import { flattenExamQuestions } from '../../lib/examSchema'
import { CheckCircle2, XCircle, MinusCircle, Loader2 } from 'lucide-react'

const STATUS_STYLES = {
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  processing: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  graded: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  )
}

function renderStudentAnswer(detail) {
  const { type, answer } = detail
  if (type === 'short_answer' || type === 'essay') {
    return answer == null || answer === '' ? (
      <span className="italic text-gray-400">No answer submitted</span>
    ) : (
      <p className="whitespace-pre-wrap">{String(answer)}</p>
    )
  }
  if (type === 'true_false') {
    return answer === true ? 'True' : answer === false ? 'False' : '—'
  }
  if (type === 'matching' && answer && typeof answer === 'object') {
    return (
      <span>
        {Object.entries(answer)
          .map(([l, r]) => `${parseInt(l, 10) + 1}→${parseInt(r, 10) + 1}`)
          .join(', ')}
      </span>
    )
  }
  if (answer == null) return <span className="italic text-gray-400">No answer submitted</span>
  if (Array.isArray(answer)) return answer.map(String).join(', ')
  return String(answer)
}

function CorrectnessIcon({ correctness }) {
  if (correctness === 'correct') return <CheckCircle2 className="h-4 w-4 text-green-600" />
  if (correctness === 'partial') return <MinusCircle className="h-4 w-4 text-amber-500" />
  return <XCircle className="h-4 w-4 text-red-500" />
}

export default function AttemptResult() {
  const { attemptId } = useParams()
  const [attempt, setAttempt] = useState(null)
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!attemptId) return
    let cancelled = false
    let timer = null
    setLoading(true)

    const fetchAll = async (lastAttempt) => {
      let att = lastAttempt
      if (!att) {
        att = await apiClient.get(`/attempts/${attemptId}`)
      }
      if (cancelled) return
      setAttempt(att)
      if (att.exam_id) {
        try {
          const ex = await apiClient.get(`/exams/student/${att.exam_id}`)
          if (!cancelled) setExam(ex)
        } catch {
          setExam(null)
        }
      }
      if (att.status === 'submitted' || att.status === 'processing') {
        timer = setInterval(async () => {
          try {
            const fresh = await apiClient.get(`/attempts/${attemptId}`)
            if (cancelled) return
            setAttempt(fresh)
            if (fresh.status === 'graded' || fresh.status === 'in_progress') {
              clearInterval(timer)
              setLoading(false)
            }
          } catch {
            clearInterval(timer)
            setLoading(false)
          }
        }, 3000)
      } else {
        setLoading(false)
      }
    }

    fetchAll().catch((err) => {
      if (cancelled) return
      setError(err.message || 'Failed to load result')
      setLoading(false)
    })

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [attemptId])

  const questionMap = useMemo(() => {
    if (!exam) return {}
    const map = {}
    flattenExamQuestions(exam.questions).forEach((q) => {
      map[q.id] = q
    })
    return map
  }, [exam])

  const details = (attempt?.grading_details || []).map((d, i) => ({
    ...d,
    _index: i,
    question: questionMap[d.question_id],
  }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link
          to="/student/dashboard"
          className="mb-4 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← Back to Dashboard
        </Link>

        {loading && !attempt && (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading result…
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        {!loading && attempt && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {exam?.title || 'Exam Result'}
                </h1>
                <p className="text-sm text-gray-500">
                  {exam?.code} · Submitted{' '}
                  {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : '—'}
                </p>
              </div>
              <StatusBadge status={attempt.status} />
            </div>

            {attempt.status === 'graded' ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
                    <p className="text-xs text-gray-500">Total Score</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {Number(attempt.total_score).toFixed(1)}{' '}
                      <span className="text-sm font-normal text-gray-500">pts</span>
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
                    <p className="text-xs text-gray-500">Objective</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {Number(attempt.objective_score).toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
                    <p className="text-xs text-gray-500">AI-Graded</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {Number(attempt.ai_score).toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Question Breakdown
                  </p>
                  {details.map((d) => (
                    <div
                      key={d._index}
                      className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <CorrectnessIcon correctness={d.correctness} />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {d.question?.question || d.question_id}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {d.type} · {d.point ?? d.points} pts
                            </p>
                          </div>
                        </div>
                        <span className="whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {Number(d.score).toFixed(1)}
                          <span className="text-xs font-normal text-gray-500">
                            {' '}
                            / {d.point ?? d.points}
                          </span>
                        </span>
                      </div>

                      <div className="ml-6">
                        <p className="mb-1 text-xs text-gray-500">Your Answer</p>
                        <div className="rounded bg-gray-50 p-2 text-sm text-gray-800 dark:bg-gray-700/40 dark:text-gray-200">
                          {renderStudentAnswer(d)}
                        </div>
                        {d.feedback != null && (
                          <>
                            <p className="mb-1 mt-2 text-xs text-gray-500">Feedback</p>
                            <p className="rounded bg-gray-50 p-2 text-sm text-gray-800 dark:bg-gray-700/40 dark:text-gray-200">
                              {d.feedback}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center rounded-md border border-gray-200 bg-white p-10 text-gray-500 dark:border-gray-600 dark:bg-gray-800">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Your exam is being graded. This page will refresh automatically…
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}