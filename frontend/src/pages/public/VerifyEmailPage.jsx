import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, ArrowRight, Mail, RefreshCw } from 'lucide-react'
import { apiFetch } from '../../lib/apiClient'

function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status')
  const detail = searchParams.get('detail')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isSuccess ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isSuccess ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSuccess ? 'Email Verified!' : 'Verification Failed'}
          </h1>

          <p className="text-gray-600 mb-6">
            {detail || (isSuccess 
              ? 'Your email has been successfully verified. You can now log in to your account.'
              : 'There was an issue verifying your email. The link may be invalid or expired.')
            }
          </p>

          {isSuccess ? (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-all"
            >
              Go to Login
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <div className="space-y-4">
              <div className="text-left">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your email to resend verification link
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              {resendMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  resendMessage.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
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
                  className="inline-flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                  Try Registering Again
                </Link>
                <div className="text-sm text-gray-500">
                  Or contact{' '}
                  <a href="mailto:yopeman318@gmail.com" className="text-indigo-600 hover:text-indigo-700">
                    support
                  </a>
                  {' '}for assistance
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
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
