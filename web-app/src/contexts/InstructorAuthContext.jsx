import { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch, getToken, setToken, clearToken } from '../lib/apiClient'

const InstructorAuthContext = createContext(null)

export function InstructorAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    // Validate the stored JWT against the backend.
    apiFetch('/auth/me')
      .then((data) => setUser(data))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    setToken(data.access_token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return (
    <InstructorAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </InstructorAuthContext.Provider>
  )
}

export function useInstructorAuth() {
  const context = useContext(InstructorAuthContext)
  if (!context) {
    throw new Error('useInstructorAuth must be used within an InstructorAuthProvider')
  }
  return context
}
