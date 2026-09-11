import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { apiFetch } from '../../lib/apiClient'
import ThemeToggle from '../../components/ThemeToggle'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase() })
      })
      setIsSuccess(true)
    } catch (error) {
      console.error('Forgot password error:', error)
      setError(error.message || 'Failed to send reset email. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-10 text-center">
            <div className="flex justify-end mb-4">
              <ThemeToggle />
            </div>
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Check Your Email</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              If an account exists for {email}, we've sent a password reset link. 
              Please check your inbox and follow the instructions.
            </p>
            <div className="space-y-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-all w-full"
              >
                Back to Login
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-10">
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          <div className="mb-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Forgot Password?</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
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
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-white dark:bg-gray-700 ${
                    error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                  } focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 dark:text-white`}
                  placeholder="your@email.com"
                />
              </div>
              {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Remember your password?{' '}
              <Link to="/login" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
