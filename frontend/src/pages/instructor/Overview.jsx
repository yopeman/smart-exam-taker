import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useInstructorAuth } from '../../contexts/InstructorAuthContext'
import { supabase } from '../../lib/supabaseClient'
import { LogOut, Building2, Users, GraduationCap, TrendingUp } from 'lucide-react'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    schools: 0,
    pilots: 0,
    paying: 0,
    loading: true
  })
  const { user, logout } = useInstructorAuth()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('school_registrations')
          .select('interested_in_pilot, willing_to_pay')
        if (error) throw error
        setStats({
          schools: data.length,
          pilots: data.filter((s) => s.interested_in_pilot).length,
          paying: data.filter((s) => s.willing_to_pay).length,
          loading: false
        })
      } catch (err) {
        console.error('Failed to load admin stats:', err)
        setStats((s) => ({ ...s, loading: false }))
      }
    }
    fetchStats()
  }, [])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/instructor/login'
  }

  const cards = [
    { label: 'Registered Schools', value: stats.schools, icon: Building2, color: 'text-indigo-500' },
    { label: 'Pilot Interest', value: stats.pilots, icon: GraduationCap, color: 'text-green-500' },
    { label: 'Willing to Pay', value: stats.paying, icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Active Users', value: '—', icon: Users, color: 'text-purple-500' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {cards.map((c) => (
            <div key={c.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{c.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.loading ? '...' : c.value}
                  </p>
                </div>
                <c.icon className={`w-8 h-8 ${c.color}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            to="/admin/schools"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Schools</h3>
              <p className="text-sm text-gray-600">View and manage registered institutions</p>
            </div>
          </Link>

          <Link
            to="/admin/users"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Users</h3>
              <p className="text-sm text-gray-600">Manage instructors and student accounts</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
