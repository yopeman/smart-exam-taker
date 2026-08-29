import { useAuth } from '../../../contexts/AuthContext'
import { LogOut, Settings, CreditCard, Building2, Users } from 'lucide-react'

// Admin scope: manages subscriptions and the overall system.
// These features are not implemented yet — this is a placeholder shell.
const AdminDashboard = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const sections = [
    {
      title: 'Subscriptions',
      desc: 'Manage institution subscriptions and billing (not implemented).',
      icon: CreditCard
    },
    {
      title: 'System Settings',
      desc: 'Global configuration for the platform (not implemented).',
      icon: Settings
    },
    {
      title: 'Schools',
      desc: 'Oversee all registered institutions.',
      icon: Building2,
      to: '/admin/schools'
    },
    {
      title: 'Users',
      desc: 'Manage instructors and students across the system (not implemented).',
      icon: Users
    }
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
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-amber-800 text-sm">
            Admin subscription and system-management features are not implemented yet.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sections.map((s) => {
            const Card = (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow h-full">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            )
            return s.to ? (
              <a key={s.title} href={s.to} className="block">
                {Card}
              </a>
            ) : (
              <div key={s.title}>{Card}</div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
