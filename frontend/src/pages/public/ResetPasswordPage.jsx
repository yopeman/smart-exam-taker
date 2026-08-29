import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { apiFetch } from '../../lib/apiClient'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    } else if (!/\d/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one digit'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!token) {
      setSubmitError('Invalid reset link. Please request a new password reset.')
      return
    }
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setSubmitError('')
    
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          new_password: formData.newPassword
        })
      })
      setIsSuccess(true)
    } catch (error) {
      console.error('Reset password error:', error)
      setSubmitError(error.message || 'Failed to reset password. The link may be invalid or expired.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Reset Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-all w-full"
            >
              Go to Login
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-6">
              The password reset link is invalid. Please request a new password reset.
            </p>
            <div className="space-y-4">
              <Link
                to="/forgot-password"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-all w-full"
              >
                Request New Reset Link
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold w-full"
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <div className="mb-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
            <p className="text-gray-600">
              Enter your new password below.
            </p>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                    errors.newPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                  } focus:ring-2 focus:ring-indigo-200 outline-none transition-all`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters with at least one digit</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                    errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                  } focus:ring-2 focus:ring-indigo-200 outline-none transition-all`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
