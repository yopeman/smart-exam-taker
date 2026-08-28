import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useInstructorAuth } from '../../contexts/InstructorAuthContext'
import { supabase } from '../../lib/supabaseClient'
import { LogOut, FileText, Plus, Clock, HelpCircle, Trash2 } from 'lucide-react'

// Mock fallback exams when the `exams` table isn't available yet.
const MOCK_EXAMS = [
  { id: 'm1', title: 'Biology Midterm', subject: 'Biology', duration_minutes: 60, question_count: 25 },
  { id: 'm2', title: 'Calculus Quiz', subject: 'Mathematics', duration_minutes: 30, question_count: 12 }
]

const ExamsList = () => {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const { logout } = useInstructorAuth()

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        setExams(data && data.length ? data : MOCK_EXAMS)
      } catch {
        setExams(MOCK_EXAMS)
      } finally {
        setLoading(false)
      }
    }
    fetchExams()
  }, [])

  const handleDelete = async (id) => {
    try {
      await supabase.from('exams').delete().eq('id', id)
      setExams((prev) => prev.filter((e) => e.id !== id))
    } catch {
      setExams((prev) => prev.filter((e) => e.id !== id))
    }
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/instructor/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Exams</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/instructor/create"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Exam
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {exams.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No exams yet</h3>
            <Link to="/instructor/create" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Create your first exam
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <button
                    onClick={() => handleDelete(exam.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mb-4">
                  {exam.subject}
                </span>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {exam.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-4 h-4" />
                    {exam.question_count} questions
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default ExamsList
