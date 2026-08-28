import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react'

// Mock exam + questions. Replace with Supabase lookups to `exams`
// and `exam_questions` once those tables exist.
const MOCK_EXAM = {
  id: 'demo-101',
  title: 'Introduction to Biology - Midterm',
  durationMinutes: 60,
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      text: 'Which organelle is responsible for producing ATP?',
      options: ['Ribosome', 'Mitochondria', 'Golgi apparatus', 'Nucleus'],
      answer: 1
    },
    {
      id: 'q2',
      type: 'multiple-choice',
      text: 'What is the powerhouse of the cell?',
      options: ['Mitochondria', 'Lysosome', 'Vacuole', 'Centriole'],
      answer: 0
    },
    {
      id: 'q3',
      type: 'true-false',
      text: 'DNA is double-stranded.',
      options: ['True', 'False'],
      answer: 0
    }
  ]
}

const TakeExam = () => {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(MOCK_EXAM.durationMinutes * 60)

  useEffect(() => {
    // Simulate fetching the exam by id.
    if (examId === MOCK_EXAM.id) {
      setExam(MOCK_EXAM)
      setTimeLeft(MOCK_EXAM.durationMinutes * 60)
    } else {
      setExam(null)
    }
  }, [examId])

  useEffect(() => {
    if (!exam || submitted) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [exam, submitted])

  const handleSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  function handleSubmit() {
    let correct = 0
    exam.questions.forEach((q) => {
      if (answers[q.id] === q.answer) correct += 1
    })
    setScore(correct)
    setSubmitted(true)
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Exam not found</h2>
          <button
            onClick={() => navigate('/exam')}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Back to portal
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    const pct = Math.round((score / exam.questions.length) * 100)
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Submitted</h2>
          <p className="text-lg text-gray-600 mb-6">
            You scored <strong className="text-gray-900">{score}</strong> / {exam.questions.length} ({pct}%)
          </p>
          <button
            onClick={() => navigate('/exam')}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Back to portal
          </button>
        </div>
      </div>
    )
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/exam')}
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate px-4">{exam.title}</h1>
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {exam.questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <p className="font-medium text-gray-900 mb-4">
                {idx + 1}. {q.text}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                      answers[q.id] === oi
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === oi}
                      onChange={() => handleSelect(q.id, oi)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-gray-800">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            className="bg-indigo-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-indigo-700 transition-all"
          >
            Submit Exam
          </button>
        </div>
      </main>
    </div>
  )
}

export default TakeExam
