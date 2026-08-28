import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useInstructorAuth } from '../../contexts/InstructorAuthContext'
import { supabase } from '../../lib/supabaseClient'
import { LogOut, FileText, Plus, BarChart3 } from 'lucide-react'

const InstructorDashboard = () => {
  const [stats, setStats] = useState({ exams: 0, submissions: 0, loading: true })
  const { user, logout } = useInstructorAuth()

  useEffect(() => {
    // Falls back to zeros if the `exams`/`exam_submissions` tables don't exist yet.
    const fetchStats = async () => {
      try {
        const { count: examCount } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
        setStats({
          exams: examCount || 0,
          submissions: 0,
          loading: false
        })
      } catch {
        setStats({ exams: 0, submissions: 0, loading: false })
      }
    }
    fetchStats()
  }, [])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/instructor/login'
  }

  const cards = [
    { label: 'My Exams', value: stats.exams, icon: FileText, color: 'text-indigo-500', to: '/instructor/exams' },
    { label: 'Submissions', value: stats.submissions, icon: BarChart3, color: 'text-green-500', to: '/instructor/exams' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {cards.map((c) => (
            <Link
              key={c.label}
              to={c.to}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{c.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.loading ? '...' : c.value}
                  </p>
                </div>
                <c.icon className={`w-8 h-8 ${c.color}`} />
              </div>
            </Link>
          ))}
        </div>

        <Link
          to="/instructor/create"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create New Exam
        </Link>
      </main>
    </div>
  )
}

export default InstructorDashboard
