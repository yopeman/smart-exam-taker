import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, ArrowRight, Search, Clock, HelpCircle } from 'lucide-react'

// Mock data -- replace with a Supabase query to `exams` once the table exists.
const MOCK_EXAMS = [
  {
    id: 'demo-101',
    title: 'Introduction to Biology - Midterm',
    subject: 'Biology',
    durationMinutes: 60,
    questionCount: 25
  },
  {
    id: 'demo-202',
    title: 'Calculus I - Quiz 3',
    subject: 'Mathematics',
    durationMinutes: 30,
    questionCount: 12
  }
]

const ExamPortal = () => {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleStart = (examId) => {
    navigate(`/exam/${examId}`)
  }

  const handleCodeSubmit = (e) => {
    e.preventDefault()
    setError('')
    const match = MOCK_EXAMS.find(
      (ex) => ex.id.toLowerCase() === code.trim().toLowerCase()
    )
    if (!match) {
      setError('No exam found for that code. Please check and try again.')
      return
    }
    handleStart(match.id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-gray-900">Smart Exam Taker</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Take Your Exam
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter the exam code provided by your instructor, or pick from the
            available public exams below.
          </p>
        </div>

        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-xl mb-12">
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Exam Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={`w-full pl-10 px-4 py-3 rounded-lg border ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-200 outline-none transition-all`}
                  placeholder="e.g. demo-101"
                />
              </div>
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              Start Exam
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Available Public Exams
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {MOCK_EXAMS.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {exam.subject}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h4>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {exam.durationMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-4 h-4" />
                    {exam.questionCount} questions
                  </span>
                </div>
                <button
                  onClick={() => handleStart(exam.id)}
                  className="w-full bg-indigo-50 text-indigo-700 py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-100 transition-all"
                >
                  Start Exam
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ExamPortal
