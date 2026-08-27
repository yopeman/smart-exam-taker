import { useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { CheckCircle, Clock, DollarSign, Shield, Zap, Users, ArrowRight, Check, X } from 'lucide-react'
import './App.css'

function App() {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    institutionName: '',
    institutionAddress: '',
    roleInInstitution: '',
    interestedInPilot: false,
    willingToPay: false,
    comments: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null) // 'success' | 'error' | null

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.institutionName.trim()) {
      newErrors.institutionName = 'Institution name is required'
    }
    
    if (!formData.institutionAddress.trim()) {
      newErrors.institutionAddress = 'Institution address is required'
    }
    
    if (!formData.roleInInstitution) {
      newErrors.roleInInstitution = 'Role in institution is required'
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
    setSubmitStatus(null)
    
    try {
      const { error } = await supabase
        .from('school_registrations')
        .insert([
          {
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            email: formData.email,
            institution_name: formData.institutionName,
            institution_address: formData.institutionAddress,
            role_in_institution: formData.roleInInstitution,
            interested_in_pilot: formData.interestedInPilot,
            willing_to_pay: formData.willingToPay,
            comments: formData.comments
          }
        ])
      
      if (error) throw error
      
      setSubmitStatus('success')
      setFormData({
        fullName: '',
        phoneNumber: '',
        email: '',
        institutionName: '',
        institutionAddress: '',
        roleInInstitution: '',
        interestedInPilot: false,
        willingToPay: false,
        comments: ''
      })
    } catch (error) {
      console.error('Submission error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Transform Your Examination Process with AI
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Save thousands of hours, eliminate paper costs, and give your faculty time to focus on what matters most teaching.
            </p>
            {/* <a href="#register" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl">
              Get Started Today
              <ArrowRight className="w-5 h-5" />
            </a> */}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Hidden Cost of Traditional Exams
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every semester, your institution loses thousands of hours on repetitive, manual exam tasks.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
              { icon: Clock, title: 'Time-Consuming Grading', desc: 'Instructors spend days formatting, printing, and grading exams manually.' },
              { icon: DollarSign, title: 'High Paper Costs', desc: 'Paper, printing, and storage costs drain your budget every semester.' },
              { icon: Users, title: 'Faculty Burnout', desc: 'Your faculty spend more time on administrative work than on teaching.' },
              { icon: X, title: 'Human Errors', desc: 'Errors in grading and data entry lead to disputes and rework.' },
              { icon: Clock, title: 'Slow Results', desc: 'Students wait weeks for results, delaying feedback and progress.' },
              { icon: Shield, title: 'Security Risks', desc: 'Paper exams are vulnerable to loss, damage, and cheating.' }
            ].map((item, index) => (
              <div key={index} className="bg-red-50 border border-red-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <item.icon className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">The Reality Schools Face Today</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold">Task</th>
                    <th className="text-right py-3 px-4 text-gray-700 font-semibold">Current Effort (per exam)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Exam preparation & formatting', '2–5 hours'],
                    ['Printing & distribution', '1–2 hours'],
                    ['Objective grading (manual)', '2–4 hours'],
                    ['Short answer / essay grading', '5–10 hours'],
                    ['Result calculation & report generation', '2–3 hours']
                  ].map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-700">{row[0]}</td>
                      <td className="py-3 px-4 text-right text-gray-700 font-medium">{row[1]}</td>
                    </tr>
                  ))}
                  <tr className="bg-indigo-50">
                    <td className="py-3 px-4 text-indigo-900 font-bold">Total instructor time per exam</td>
                    <td className="py-3 px-4 text-right text-indigo-900 font-bold">12–24 hours</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-center mt-6 text-gray-600 italic">
              Multiply this by the number of exams per semester, per instructor. Your faculty are spending more time on administrative work than on teaching.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Introducing Smart Exam Taker
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              An AI-assisted digital examination platform designed for universities, colleges, and schools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
              { icon: Zap, title: 'AI Document Conversion', desc: 'Convert your exam documents (PDF, Word, PowerPoint) into structured digital exams no new question writing required.' },
              { icon: Shield, title: 'Secure Digital Exams', desc: 'Conduct exams securely and digitally on students devices with identity verification.' },
              { icon: CheckCircle, title: 'Automatic Grading', desc: 'Automatically grades objective questions and uses AI to assist with short answers and essays.' },
              { icon: Users, title: 'Professional Reports', desc: 'Generate professional, branded reports in PDF, Excel, and CSV instantly.' },
              { icon: Clock, title: 'Multi-Institution Support', desc: 'Manage multiple institutions on one platform, each with its own branding and subscription.' },
              { icon: DollarSign, title: 'Cost Effective', desc: 'Eliminate paper & printing costs while reducing instructor workload by 10-20 hours per exam.' }
            ].map((item, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <item.icon className="w-12 h-12 text-indigo-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works – A Simple 4-Step Process
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Upload Document', desc: 'Upload exam document (PDF, Word, etc.)' },
              { step: '2', title: 'AI Processing', desc: 'AI extracts and structures questions into digital format' },
              { step: '3', title: 'Review & Schedule', desc: 'Instructor reviews, edits, and schedules the exam' },
              { step: '4', title: 'Automatic Results', desc: 'Students take the exam; grading and reports are automatic' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real-World ROI Example
            </h2>
            <p className="text-xl text-gray-600">See the savings for yourself</p>
          </div>

          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl">
            <p className="text-lg text-gray-700 mb-8">
              <strong>Scenario:</strong> A department with 10 instructors, each conducting 3 exams per semester.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-red-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-red-800 mb-4">Current Manual Process</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">~15 hours per exam × 30 exams = <strong>450 hours/semester</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Paper & printing costs: <strong>5,000 ETB - 10,000 ETB per semester</strong></span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-green-800 mb-4">With Smart Exam Taker</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">~2 hours per exam × 30 exams = <strong>60 hours/semester</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Time saved: <strong>390 hours</strong> (9.75 weeks of full-time work)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Paper & printing savings: <strong>5,000 ETB - 10,000 ETB per semester</strong></span>
                  </li>
                </ul>
              </div>
            </div>
            
            <p className="text-center mt-8 text-lg text-gray-700 font-semibold">
              Even at a conservative hourly rate, the system pays for itself within the first semester.
            </p>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section id="register" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Start Your Transformation Today
            </h2>
            <p className="text-xl text-gray-600">
              Register your interest and we'll contact you when Smart Exam Taker is ready for deployment.
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 md:p-12 shadow-xl">
            {submitStatus === 'success' ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Thank you for your interest in Smart Exam Taker. We will contact you as soon as the system is ready for deployment.
                </p>
                <button
                  onClick={() => setSubmitStatus(null)}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Register another institution
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.fullName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-200 outline-none transition-all`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.phoneNumber ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-200 outline-none transition-all`}
                      placeholder="+1 234 567 8900"
                    />
                    {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-200 outline-none transition-all`}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="institutionName" className="block text-sm font-medium text-gray-700 mb-2">
                    Institution Name *
                  </label>
                  <input
                    type="text"
                    id="institutionName"
                    name="institutionName"
                    value={formData.institutionName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.institutionName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-200 outline-none transition-all`}
                    placeholder="Enter your institution name"
                  />
                  {errors.institutionName && <p className="mt-1 text-sm text-red-600">{errors.institutionName}</p>}
                </div>

                <div>
                  <label htmlFor="institutionAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    Institution Address *
                  </label>
                  <input
                    type="text"
                    id="institutionAddress"
                    name="institutionAddress"
                    value={formData.institutionAddress}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.institutionAddress ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-200 outline-none transition-all`}
                    placeholder="Enter your institution address"
                  />
                  {errors.institutionAddress && <p className="mt-1 text-sm text-red-600">{errors.institutionAddress}</p>}
                </div>

                <div>
                  <label htmlFor="roleInInstitution" className="block text-sm font-medium text-gray-700 mb-2">
                    Role in Institution *
                  </label>
                  <select
                    id="roleInInstitution"
                    name="roleInInstitution"
                    value={formData.roleInInstitution}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.roleInInstitution ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'} focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white`}
                  >
                    <option value="">Select your role</option>
                    <option value="Owner">Owner</option>
                    <option value="Director">Director</option>
                    <option value="Principal">Principal</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.roleInInstitution && <p className="mt-1 text-sm text-red-600">{errors.roleInInstitution}</p>}
                </div>

                <div>
                  <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (Optional)
                  </label>
                  <textarea
                    id="comments"
                    name="comments"
                    value={formData.comments}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                    placeholder="Any additional information or questions you'd like to share..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="interestedInPilot"
                      checked={formData.interestedInPilot}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                    />
                    <span className="text-gray-700">
                      I am interested in participating in the pilot program to test Smart Exam Taker
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="willingToPay"
                      checked={formData.willingToPay}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                    />
                    <span className="text-gray-700">
                      I am willing to pay for Smart Exam Taker after the system is completed
                    </span>
                  </label>
                </div>

                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">
                      There was an error submitting your registration. Please try again or contact us directly.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? 'Submitting...' : 'Register Interest'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Smart Exam Taker</h3>
          <p className="text-gray-400 mb-6">AI-Assisted Digital Examination Platform</p>
          <p className="text-gray-500 text-sm">
            © 2024 Smart Exam Taker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
