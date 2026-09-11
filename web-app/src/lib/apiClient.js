import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const API_PREFIX = '/api/v1'

export const TOKEN_KEY = 'instructor_jwt'

export function getToken() {
  // Check sessionStorage first (non-persistent), then localStorage (persistent)
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
}

export function setToken(token, persistent = true) {
  if (persistent) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor to include token
apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    if (response.status === 204) return null
    return response.data
  },
  (error) => {
    let detail = 'Request failed'
    if (error.response) {
      detail = error.response.data?.detail || detail
    } else if (error.message) {
      detail = error.message
    }
    throw new Error(detail)
  }
)

export async function apiFetch(path, options = {}) {
  const method = options.method || 'GET'
  const data = options.body ? JSON.parse(options.body) : undefined
  
  const response = await apiClient.request({
    method,
    url: path,
    data,
    headers: options.headers
  })
  
  return response
}
