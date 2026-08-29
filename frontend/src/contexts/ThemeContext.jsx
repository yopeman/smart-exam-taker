import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

const THEME_KEY = 'theme'

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('system')
  const [resolvedTheme, setResolvedTheme] = useState('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY)
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    let effectiveTheme = theme
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    root.classList.add(effectiveTheme)
    setResolvedTheme(effectiveTheme)
  }, [theme])

  const setThemeMode = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem(THEME_KEY, newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
