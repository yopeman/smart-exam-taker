import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, ArrowRight, Mail, RefreshCw } from 'lucide-react'
import { apiFetch } from '../../lib/apiClient'
import ThemeToggle from '../../components/ThemeToggle'

const MOBILE_APP_SCHEME = 'smart-exam-taker'
const DESKTOP_APP_SCHEME = 'smart-exam-taker-desktop'

function isMobileDevice() {
  const ua = navigator.userAgent || navigator.vendor || window.opera || ''
  return /(Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone|Opera Mini|IEMobile|Mobile)/i.test(ua)
}

function buildAppLoginUrl(status, detail) {
  const query = new URLSearchParams({ status, detail }).toString()
  const scheme = isMobileDevice() ? MOBILE_APP_SCHEME : DESKTOP_APP_SCHEME
  return `${scheme}://login?${query}`
}

function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status')
  const detail = searchParams.get('detail')
  const role = searchParams.get('role')
  const isStudent = role === 'student'
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [email, setEmail] = useState('')

  const isSuccess = status === 'success'

  const handleResendVerification = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setResendMessage('Please enter your email address')
      return
    }
    
    setIsResending(true)
    setResendMessage('')
    
    try {
      await apiFetch('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase() })
      })
      setResendMessage('A new verification link has been sent to your email.')
      setEmail('')
    } catch (error) {
      console.error('Resend verification error:', error)
      setResendMessage(error.message || 'Failed to resend verification email.')
    } finally {
      setIsResending(false)
    }
  }

  const handleGoToLogin = (e) => {
    if (!isStudent) return
    e.preventDefault()
    window.location.href = buildAppLoginUrl(status, detail)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-10 text-center">
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isSuccess ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            {isSuccess ? (
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isSuccess ? 'Email Verified!' : 'Verification Failed'}
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {detail || (isSuccess 
              ? 'Your email has been successfully verified. You can now log in to your account.'
              : 'There was an issue verifying your email. The link may be invalid or expired.')
            }
          </p>

          {isSuccess ? (
            <Link
              to="/login"
              onClick={handleGoToLogin}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-all"
            >
              Go to Login
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <div className="space-y-4">
              <div className="text-left">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter your email to resend verification link
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 dark:text-white"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              {resendMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  resendMessage.includes('sent') ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                  {resendMessage}
                </div>
              )}
              
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Resend Verification Email
                  </>
                )}
              </button>
              
              <div className="flex flex-col gap-2">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                  Try Registering Again
                </Link>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Or contact{' '}
                  <a href="mailto:yopeman318@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                    support
                  </a>
                  {' '}for assistance
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
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

export default VerifyEmailPage
