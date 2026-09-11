import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, ArrowRight, RefreshCw } from 'lucide-react'
import { apiFetch, setToken } from '../../lib/apiClient'
import ThemeToggle from '../../components/ThemeToggle'

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const navigate = useNavigate()

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email')
    if (savedEmail) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail,
        rememberMe: true
      }))
    }
  }, [])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setSubmitError('')
    
    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })
      
      // Store the token based on remember me preference
      setToken(response.access_token, formData.rememberMe)
      
      // Handle remember me for email
      if (formData.rememberMe) {
        localStorage.setItem('remembered_email', formData.email)
      } else {
        localStorage.removeItem('remembered_email')
      }
      
      // Navigate to dashboard or appropriate page based on user role
      if (response.user.role === 'admin') {
        navigate('/admin/sb')
      } else if (response.user.role === 'instructor') {
        navigate('/instructor/dashboard')
      } else if (response.user.role === 'student') {
        navigate('/student/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      setSubmitError(error.message || 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendVerification = async () => {
    setIsResending(true)
    setResendMessage('')
    
    try {
      await apiFetch('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email })
      })
      setResendMessage('A new verification link has been sent to your email.')
    } catch (error) {
      console.error('Resend verification error:', error)
      setResendMessage(error.message || 'Failed to resend verification email.')
    } finally {
      setIsResending(false)
    }
  }

  const isVerificationError = submitError.includes('verify your email')

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-10">
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
            <p className="text-gray-600 dark:text-gray-300">Sign in to your Smart Exam Taker account</p>
          </div>

          {submitError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-700 dark:text-red-300 text-sm mb-2">{submitError}</p>
              {isVerificationError && (
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Resend verification email
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {resendMessage && !isVerificationError && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              resendMessage.includes('sent') ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            }`}>
              {resendMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-white dark:bg-gray-700 ${
                    errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                  } focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 dark:text-white`}
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-white dark:bg-gray-700 ${
                    errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                  } focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 dark:text-white`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Signing in...' : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
