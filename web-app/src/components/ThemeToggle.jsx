import { useTheme } from '../contexts/ThemeContext'
import { Sun, Moon, Monitor } from 'lucide-react'

function ThemeToggle() {
  const { theme, setThemeMode } = useTheme()

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setThemeMode(value)}
          className={`p-2 rounded-md transition-all ${
            theme === value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  )
}

export default ThemeToggle
