import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

const THEME_KEY = 'theme'

const applyThemeToDOM = (themeValue) => {
  const root = window.document.documentElement
  root.classList.remove('light', 'dark')

  let effectiveTheme = themeValue
  if (themeValue === 'system') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  root.classList.add(effectiveTheme)
  return effectiveTheme
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_KEY)
    return savedTheme || 'system'
  })
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'system'
    return applyThemeToDOM(savedTheme)
  })

  useEffect(() => {
    const effectiveTheme = applyThemeToDOM(theme)
    setResolvedTheme(effectiveTheme)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const effectiveTheme = applyThemeToDOM('system')
      setResolvedTheme(effectiveTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
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
