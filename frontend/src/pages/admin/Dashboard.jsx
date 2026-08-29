import { useAuth } from '../../contexts/AuthContext'
import { Settings, CreditCard, Building2, Users } from 'lucide-react'
import DashboardNavbar from '../../components/DashboardNavbar'

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-900">
      <DashboardNavbar 
        title="Admin Dashboard" 
        userEmail={user?.email} 
        onLogout={handleLogout}
        showProfileButtons={false}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8">
          <p className="text-amber-800 dark:text-amber-200 text-sm">
            Admin subscription and system-management features are not implemented yet.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sections.map((s) => {
            const Card = (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow h-full">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{s.desc}</p>
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
