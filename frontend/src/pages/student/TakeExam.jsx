import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../../lib/apiClient'
import DashboardNavbar from '../../components/DashboardNavbar'
import {
  QuestionType,
  flattenExamQuestions,
  buildAttemptsPayload,
} from '../../lib/examSchema'

const inputCls =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white'

function StepInfo({ form, setForm, onNext }) {
  const [errors, setErrors] = useState({})
  const handle = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }
  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.student_first_name) errs.student_first_name = 'First name is required'
    if (!form.student_last_name) errs.student_last_name = 'Last name is required'
    if (!form.student_id_number) errs.student_id_number = 'Student ID is required'
    setErrors(errs)
    if (Object.keys(errs).length === 0) onNext()
  }
  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          First Name
        </label>
        <input
          name="student_first_name"
          value={form.student_first_name}
          onChange={handle}
          className={inputCls}
        />
        {errors.student_first_name && (
          <p className="mt-1 text-xs text-red-600">{errors.student_first_name}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Last Name
        </label>
        <input
          name="student_last_name"
          value={form.student_last_name}
          onChange={handle}
          className={inputCls}
        />
        {errors.student_last_name && (
          <p className="mt-1 text-xs text-red-600">{errors.student_last_name}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Student ID
        </label>
        <input
          name="student_id_number"
          value={form.student_id_number}
          onChange={handle}
          className={inputCls}
        />
        {errors.student_id_number && (
          <p className="mt-1 text-xs text-red-600">{errors.student_id_number}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Department
          </label>
          <input name="department" value={form.department} onChange={handle} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Year of Study
          </label>
          <input
            name="year_of_study"
            type="number"
            value={form.year_of_study}
            onChange={handle}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Semester
          </label>
          <input name="semester" value={form.semester} onChange={handle} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Section
          </label>
          <input name="section" value={form.section} onChange={handle} className={inputCls} />
        </div>
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Continue
      </button>
    </form>
  )
}

function MCQAnswer({ qn, value, onChange }) {
  const selected = Array.isArray(value) ? value : []
  const toggle = (letter) => {
    const next = selected.includes(letter)
      ? selected.filter((l) => l !== letter)
      : [...selected, letter]
    onChange(next)
  }
  return (
    <div className="space-y-2">
      {qn.options.map((opt) => {
        const active = selected.includes(opt.letter)
        return (
          <button
            key={opt.letter}
            type="button"
            onClick={() => toggle(opt.letter)}
            className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm ${
              active
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <span className="font-semibold text-indigo-600">{opt.letter}</span>
            <span className="text-gray-800 dark:text-gray-100">{opt.option}</span>
          </button>
        )
      })}
    </div>
  )
}

function TrueFalseAnswer({ value, onChange }) {
  return (
    <div className="flex gap-3">
      {[true, false].map((tf) => (
        <button
          key={String(tf)}
          type="button"
          onClick={() => onChange(tf)}
          className={`flex-1 rounded-md border px-3 py-2 text-sm ${
            value === tf
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          {tf ? 'True' : 'False'}
        </button>
      ))}
    </div>
  )
}

function MatchingAnswer({ qn, value, onChange }) {
  const mapping = value && typeof value === 'object' ? { ...value } : {}
  const setMapping = (leftIdx, rightIdx) => {
    const next = { ...mapping }
    const prevUsed = Object.entries(next).find(([, r]) => r === rightIdx)
    if (prevUsed) delete next[prevUsed[0]]
    next[leftIdx] = rightIdx
    onChange(next)
  }
  return (
    <div className="space-y-2">
      {qn.left_items.map((left, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600">
            {left}
          </div>
          <select
            value={mapping[i] ?? ''}
            onChange={(e) => e.target.value !== '' && setMapping(i, Number(e.target.value))}
            className={inputCls + ' w-40'}
          >
            <option value="">Select...</option>
            {qn.right_items.map((right, ri) => (
              <option key={ri} value={ri}>
                {right}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

function BlankSpaceAnswer({ qn, value, onChange }) {
  const count = qn.correct_answers?.length || 1
  const blanks = Array.isArray(value) ? value : []
  const setBlank = (i, text) => {
    const next = Array.from({ length: count }, (_, idx) => blanks[idx] ?? '')
    next[i] = text
    onChange(next)
  }
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <label className="mb-1 block text-xs text-gray-500">Blank #{i + 1}</label>
          <input
            value={blanks[i] ?? ''}
            onChange={(e) => setBlank(i, e.target.value)}
            className={inputCls}
            placeholder="Your answer"
          />
        </div>
      ))}
    </div>
  )
}

function QuestionCard({ qn, index, answers, onAnswer }) {
  const value = answers[qn.id]
  return (
    <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-indigo-600">
          Question {index + 1} · {qn.point} pts
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 capitalize dark:bg-gray-700">
          {qn.type.replace('_', ' ')}
        </span>
      </div>
      <p className="mb-4 text-sm font-medium text-gray-900 dark:text-white">{qn.question}</p>

      {qn.type === QuestionType.MCQ && (
        <MCQAnswer qn={qn} value={value} onChange={(v) => onAnswer(qn.id, v)} />
      )}
      {qn.type === QuestionType.TRUE_FALSE && (
        <TrueFalseAnswer value={value} onChange={(v) => onAnswer(qn.id, v)} />
      )}
      {qn.type === QuestionType.MATCHING && (
        <MatchingAnswer qn={qn} value={value} onChange={(v) => onAnswer(qn.id, v)} />
      )}
      {qn.type === QuestionType.BLANK_SPACE && (
        <BlankSpaceAnswer qn={qn} value={value} onChange={(v) => onAnswer(qn.id, v)} />
      )}
      {qn.type === QuestionType.SHORT_ANSWER && (
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onAnswer(qn.id, e.target.value)}
          rows={4}
          placeholder="Type your answer here..."
          className={inputCls}
        />
      )}
    </div>
  )
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TakeExam() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [examCode, setExamCode] = useState('')
  const [step, setStep] = useState('info')
  const [form, setForm] = useState({
    student_first_name: '',
    student_last_name: '',
    student_id_number: '',
    department: '',
    year_of_study: '',
    semester: '',
    section: '',
  })
  const [attemptId, setAttemptId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!examId) return
    apiClient
      .get(`/exams/student/${examId}`)
      .then((data) => {
        setExam(data)
        setExamCode(data.code)
      })
      .catch((err) => setError(err.message || 'Failed to load exam'))
  }, [examId])

  useEffect(() => {
    if (step !== 'questions') return
    const total = (exam?.duration_minutes || 0) * 60
    setTimeLeft(total)
  }, [step, exam])

  const submitRef = useRef(null)
  submitRef.current = handleSubmit

  useEffect(() => {
    if (step !== 'questions') return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          submitRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step])

  const loadQuestions = async (attempt) => {
    const data = attempt?.exam || (await apiClient.get(`/exams/student/${examId}`))
    const list = data.questions ? flattenExamQuestions(data.questions) : []
    setQuestions(list)
    setAttemptId(attempt.id)
    setStep('questions')
  }

  const handleStart = async () => {
    setError('')
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v != null) fd.append(k, k === 'year_of_study' ? Number(v) : v)
      })
      fd.append('exam_code', examCode)
      const attempt = await apiClient.post('/attempts/start', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await loadQuestions(attempt)
    } catch (err) {
      setError(err.message || 'Failed to start exam')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!attemptId) return
    setSubmitting(true)
    setError('')
    try {
      await apiClient.post(`/attempts/${attemptId}/submit`, buildAttemptsPayload(answers))
      navigate(`/student/attempts/${attemptId}`)
    } catch (err) {
      setError(err.message || 'Failed to submit exam')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar title={exam?.title || 'Take Exam'} />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        {step === 'info' && (
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
              {exam?.title || 'Student Information'}
            </h2>
            {exam?.description && (
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {exam.description}
              </p>
            )}
            <StepInfo form={form} setForm={setForm} onNext={handleStart} />
          </div>
        )}

        {step === 'questions' && (
          <>
            <div className="mb-4 flex items-center justify-between rounded-lg bg-indigo-600 px-4 py-3 text-white">
              <span className="text-sm font-medium">Time Remaining: {formatTime(timeLeft)}</span>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-md bg-white/20 px-3 py-1.5 text-sm font-semibold hover:bg-white/30 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>

            {questions.length === 0 && (
              <div className="rounded-lg bg-white p-6 text-center text-sm text-gray-500 shadow dark:bg-gray-800">
                No questions available for this exam.
              </div>
            )}

            <div className="space-y-4">
              {questions.map((qn, i) => {
                const showScenario = qn.scenario && (i === 0 || questions[i - 1].scenario !== qn.scenario)
                return (
                  <div key={qn.id}>
                    {showScenario && (
                      <div className="mb-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-gray-800 dark:border-indigo-800 dark:bg-indigo-950 dark:text-gray-100">
                        <span className="mb-1 block text-xs font-semibold text-indigo-600 uppercase">
                          Passage
                        </span>
                        {qn.scenario}
                      </div>
                    )}
                    <QuestionCard
                      qn={qn}
                      index={i}
                      answers={answers}
                      onAnswer={(id, value) => setAnswers((a) => ({ ...a, [id]: value }))}
                    />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}