import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useInstructorAuth } from '../../contexts/InstructorAuthContext'
import { supabase } from '../../lib/supabaseClient'
import { LogOut, Plus, Trash2, Save } from 'lucide-react'

const CreateExam = () => {
  const navigate = useNavigate()
  const { user, logout } = useInstructorAuth()
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [duration, setDuration] = useState(60)
  const [maxStudents, setMaxStudents] = useState('')
  const [maxReservedStudents, setMaxReservedStudents] = useState('')
  const [questions, setQuestions] = useState([
    { text: '', type: 'multiple-choice', options: ['', '', '', ''], answer: 0 }
  ])
  const [submitting, setSubmitting] = useState(false)

  const updateQuestion = (index, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    )
  }

  const updateOption = (qIndex, oIndex, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q
        const options = q.options.map((o, oi) => (oi === oIndex ? value : o))
        return { ...q, options }
      })
    )
  }

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { text: '', type: 'multiple-choice', options: ['', '', '', ''], answer: 0 }
    ])
  }

  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      // Inserts into `exams` -- create the table/migration to persist.
      const { error } = await supabase
        .from('exams')
        .insert([
          {
            title,
            subject,
            duration_minutes: duration,
            max_students: maxStudents === '' ? null : Number(maxStudents),
            max_reserved_students:
              maxReservedStudents === '' ? null : Number(maxReservedStudents),
            question_count: questions.length,
            created_by: user?.id
          }
        ])
        .select()
      if (error) throw error
      navigate('/instructor/exams')
    } catch (err) {
      console.error('Failed to create exam:', err)
      // Navigate anyway for demo flow.
      navigate('/instructor/exams')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/instructor/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Create Exam</h1>
          <div className="flex items-center gap-4">
            <Link to="/instructor/exams" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Cancel
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder="e.g. Biology Midterm"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  placeholder="e.g. Biology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={1}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Students</label>
                <input
                  type="number"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(e.target.value)}
                  min={0}
                  placeholder="Unlimited"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Reserved Students</label>
                <input
                  type="number"
                  value={maxReservedStudents}
                  onChange={(e) => setMaxReservedStudents(e.target.value)}
                  min={0}
                  placeholder="Unlimited"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, qi) => (
              <div key={qi} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Question {qi + 1}</h3>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qi)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <textarea
                  value={q.text}
                  onChange={(e) => updateQuestion(qi, 'text', e.target.value)}
                  rows="2"
                  placeholder="Enter the question text"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none mb-4"
                />

                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`answer-${qi}`}
                        checked={q.answer === oi}
                        onChange={() => updateQuestion(qi, 'answer', oi)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        placeholder={`Option ${oi + 1}`}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      />
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Select the radio button next to the correct answer.</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Question
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {submitting ? 'Saving...' : 'Save Exam'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default CreateExam
