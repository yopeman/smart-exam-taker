import { useState, useEffect, useMemo } from 'react'
import { apiClient } from '../../lib/apiClient'
import DashboardNavbar from '../../components/DashboardNavbar'
import { usePagination, Pagination } from '../../components/Pagination'
import { ClipboardList, User as UserIcon, ChevronRight, X, Search } from 'lucide-react'

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

function renderAnswer(detail) {
  const { type, answer } = detail
  if (type === 'short_answer' || type === 'essay') {
    return answer == null || answer === '' ? (
      <span className="italic text-gray-400">No answer submitted</span>
    ) : (
      <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{String(answer)}</p>
    )
  }
  if (type === 'true_false') {
    return (
      <span className="text-gray-800 dark:text-gray-200">
        {answer === true ? 'True' : answer === false ? 'False' : '—'}
      </span>
    )
  }
  if (type === 'matching' && answer && typeof answer === 'object') {
    return (
      <span className="text-gray-800 dark:text-gray-200">
        {Object.entries(answer)
          .map(([l, r]) => `${l}→${r}`)
          .join(', ')}
      </span>
    )
  }
  if (answer == null) {
    return <span className="italic text-gray-400">No answer submitted</span>
  }
  if (Array.isArray(answer)) {
    return (
      <span className="text-gray-800 dark:text-gray-200">
        {answer.map((a) => String(a)).join(', ')}
      </span>
    )
  }
  return <span className="text-gray-800 dark:text-gray-200">{String(answer)}</span>
}

function readOnlyField(label, value) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}

function flattenExamQuestions(exam) {
  const map = {}
  ;(exam?.questions?.questions || []).forEach((group) => {
    ;(group.questions || []).forEach((q) => {
      map[q.id] = q
    })
  })
  return map
}

function renderCorrectAnswer(q) {
  if (!q) return <span className="italic text-gray-400">Unknown</span>
  const inner = q.question || q
  switch (inner.type) {
    case 'mcq':
      return (
        <span>
          {inner.correct_answer}
          {inner.options && (
            <span className="text-gray-500">
              {' — '}
              {inner.options.find((o) => o.letter === inner.correct_answer)?.option}
            </span>
          )}
        </span>
      )
    case 'true_false':
      return <span>{inner.correct_answer ? 'True' : 'False'}</span>
    case 'matching':
      return (
        <span>
          {Object.entries(inner.correct_mapping || {})
            .map(([l, r]) => `${l}→${r}`)
            .join(', ')}
        </span>
      )
    case 'blank_space':
      return <span>{Array.isArray(inner.correct_answers) ? inner.correct_answers.join(', ') : String(inner.correct_answers)}</span>
    case 'short_answer':
    case 'essay':
      return (
        <span className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
          {String(inner.correct_answer ?? '—')}
        </span>
      )
    default:
      return <span>{String(inner.correct_answer ?? inner.correct_answers ?? '—')}</span>
  }
}

function deriveCorrectness(detail, score) {
  const val = score === '' || score == null ? 0 : Number(score) || 0
  const max = Number(detail.point ?? detail.points) || 0
  if (max <= 0) return detail.correctness || 'incorrect'
  if (val >= max) return 'correct'
  if (val > 0) return 'partial'
  return 'incorrect'
}

function AttemptDetail({ attempt, exam, onClose, onSaved }) {
  const [scores, setScores] = useState(
    (attempt.grading_details || []).map((d) => (d.score != null ? d.score : 0))
  )
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const details = attempt.grading_details || []
  const hasDetails = details.length > 0

  const questionMap = useMemo(() => flattenExamQuestions(exam), [exam])

  const objectiveTypes = ['mcq', 'true_false', 'matching', 'blank_space']

  const computed = useMemo(() => {
    let objective = 0
    let ai = 0
    details.forEach((d, i) => {
      const s = Number(scores[i]) || 0
      if (objectiveTypes.includes(d.type)) objective += s
      else if (d.type === 'short_answer' || d.type === 'essay') ai += s
      else objective += s
    })
    return { objective, ai, total: objective + ai }
  }, [details, scores])

  const updateScore = (idx, value) => {
    const next = [...scores]
    next[idx] = value === '' ? '' : Number(value)
    setScores(next)
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    setError('')
    try {
      const updatedDetails = details.map((d, i) => ({
        ...d,
        score: scores[i] === '' ? 0 : Number(scores[i]),
        correctness: deriveCorrectness(d, scores[i]),
      }))
      const saved = await apiClient.patch(`/attempts/${attempt.id}/scores`, {
        grading_details: updatedDetails,
        objective_score: computed.objective,
        ai_score: computed.ai,
        total_score: computed.total,
      })
      setMsg('Scores updated successfully')
      if (onSaved) onSaved(saved)
    } catch (err) {
      setError(err.message || 'Failed to save scores')
    } finally {
      setSaving(false)
    }
  }

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
          <div
            className="flex items-center gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-700/40"
            style={
              exam?.school?.primary_color
                ? { borderLeft: `4px solid ${exam.school.primary_color}` }
                : undefined
            }
          >
            {exam?.school?.logo_url ? (
              <img
                src={exam.school.logo_url}
                alt={exam.school.name || 'School logo'}
                className="w-24 rounded-md border border-gray-200 bg-white object-contain dark:border-gray-600"
                style={
                  exam?.school?.primary_color
                    ? { borderColor: exam.school.primary_color }
                    : undefined
                }
              />
            ) : exam?.school?.name ? (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-md text-lg font-bold text-white"
                style={{
                  backgroundColor: exam.school.primary_color || '#4f46e5',
                }}
              >
                {exam.school.name.charAt(0).toUpperCase()}
              </div>
            ) : null}
            <div className="min-w-0">
              {exam?.school?.name && (
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {exam.school.name}
                </p>
              )}
              {exam?.school?.location && (
                <p className="text-xs text-gray-500">{exam.school.location}</p>
              )}
              <p className="font-medium text-gray-900 dark:text-white">
                {exam?.title || 'Unknown exam'}{' '}
                <span className="text-xs text-gray-500">({exam?.code})</span>
              </p>
            </div>
          </div>

          {attempt.student_face_url && (
            <div>
              <p className="mb-1 text-xs text-gray-500">Captured Face</p>
              <img
                src={attempt.student_face_url}
                alt={`${attempt.student_first_name} ${attempt.student_last_name}`}
                className="h-28 w-28 rounded-md border border-gray-200 object-cover dark:border-gray-600"
              />
              <p className="mt-1 text-xs text-gray-500">
                Captured: {formatDate(attempt.face_captured_at)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-700/40">
            {readOnlyField(
              'Student',
              `${attempt.student_first_name} ${attempt.student_last_name}`
            )}
            {readOnlyField('ID Number', attempt.student_id_number)}
            {readOnlyField('Department', attempt.department || '—')}
            {readOnlyField('School', exam?.school?.name || '—')}
            {readOnlyField(
              'Year / Semester / Section',
              `${attempt.year_of_study || '—'} / ${attempt.semester || '—'} / ${
                attempt.section || '—'
              }`
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md bg-gray-50 p-2 dark:bg-gray-700/40">
              <p className="text-xs text-gray-500">Objective</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {computed.objective}
              </p>
            </div>
            <div className="rounded-md bg-gray-50 p-2 dark:bg-gray-700/40">
              <p className="text-xs text-gray-500">AI</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {computed.ai}
              </p>
            </div>
            <div className="rounded-md bg-gray-50 p-2 dark:bg-gray-700/40">
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {computed.total}
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
            <p className="mb-2 text-xs text-gray-500">
              Answers &amp; Grading
            </p>
{hasDetails ? (
              <div className="space-y-3">
                {details.map((d, i) => {
                          const q = questionMap[d.question_id]
                          const inner = q?.question || q
                          const liveCorrectness = deriveCorrectness(d, scores[i])
                          return (
                            <div
                              key={i}
                              className="rounded-md border border-gray-200 p-3 dark:border-gray-600"
                            >
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {q ? inner?.question || q.id : d.question_id || `Q${d.index + 1}`}
                                  <span className="ml-2 text-xs font-normal text-gray-500">
                                    {d.type} · {d.point ?? d.points} pts
                                  </span>
                                </p>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    liveCorrectness === 'correct'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                      : liveCorrectness === 'partial'
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                  }`}
                                >
                                  {liveCorrectness === 'correct'
                                    ? 'Correct'
                                    : liveCorrectness === 'partial'
                                      ? 'Partial'
                                      : 'Incorrect'}
                                </span>
                              </div>

                      {q && (
                        <p className="mb-2 break-all text-xs text-gray-400">{q.id}</p>
                      )}

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-xs text-gray-500">Correct Answer</p>
                          <div className="rounded bg-gray-50 p-2 text-xs text-gray-900 dark:bg-gray-700/40 dark:text-white">
                            {renderCorrectAnswer(q)}
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-xs text-gray-500">Student Answer</p>
                          <div className="rounded bg-gray-50 p-2 text-xs dark:bg-gray-700/40">
                            {renderAnswer(d)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="mb-1 text-xs text-gray-500">Feedback</p>
                        <p className="rounded bg-gray-50 p-2 text-xs text-gray-800 dark:bg-gray-700/40 dark:text-gray-200">
                          {d.feedback != null ? d.feedback : '—'}
                        </p>
                      </div>

                      <label className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-500">Score</span>
                        <input
                          type="number"
                          step="0.01"
                          value={scores[i]}
                          onChange={(e) => updateScore(i, e.target.value)}
                          className="w-28 rounded border border-gray-300 bg-white px-2 py-1 text-right text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </label>
                    </div>
                  )
                })}
              </div>
            ) : (
              <pre className="max-h-60 overflow-auto rounded-md bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-700/40 dark:text-gray-200">
                {JSON.stringify(attempt.answers, null, 2)}
              </pre>
            )}
          </div>

          {msg && (
            <div className="rounded-md bg-green-50 p-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
              {msg}
            </div>
          )}
          {error && (
            <div className="rounded-md bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Scores'}
            </button>
          </div>
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
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)

  const handleSaved = (saved) => {
    setAttempts((prev) =>
      prev.map((a) => (a.id === saved.id ? saved : a))
    )
    setDetail(saved)
  }

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
    const q = search.trim().toLowerCase()
    return attempts.filter((a) => {
      if (filterExam && a.exam_id !== filterExam) return false
      if (!q) return true
      const exam = examMap[a.exam_id]
      const haystack = [
        a.student_first_name,
        a.student_last_name,
        a.student_id_number,
        a.department,
        a.section,
        exam?.title,
        exam?.code,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [attempts, filterExam, search, examMap])

  const pagination = usePagination(filtered)

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

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Student name, ID, department, section, exam..."
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by Exam
            </label>
            <select
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All exams</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg bg-white py-12 text-center shadow dark:bg-gray-800">
            <ClipboardList className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">No attempts found</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {pagination.paged.map((a) => {
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

            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}
      </main>

      {detail && (
        <AttemptDetail
          attempt={detail}
          exam={examMap[detail.exam_id]}
          onClose={() => setDetail(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
