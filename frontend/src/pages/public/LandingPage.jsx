import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  CheckCircle,
  Clock,
  DollarSign,
  Shield,
  Zap,
  Users,
  ArrowRight,
  Check,
  X,
  Menu,
  X as CloseIcon,
} from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white scroll-smooth">
      {/* Sticky Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            Smart Exam Taker
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#problem" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Problem</a>
            <a href="#solution" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Solution</a>
            <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">How It Works</a>
            <a href="#roi" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">ROI</a>
            <a href="#register" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Get Started</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              Register
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              Login
            </Link>
            <ThemeToggle />
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {mobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
            <div className="flex flex-col gap-4">
              <a href="#problem" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>Problem</a>
              <a href="#solution" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>Solution</a>
              <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              <a href="#roi" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>ROI</a>
              <a href="#register" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>Get Started</a>
              <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-4 py-2 rounded-full text-sm font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Register
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-4 py-2 rounded-full text-sm font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
                <div className="flex justify-center">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white overflow-hidden pt-16">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Transform Your Examination Process with AI
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-blue-100 max-w-3xl mx-auto">
            Save thousands of hours, eliminate paper costs, and give your faculty time to focus on what matters most — teaching.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#register"
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
            >
              Get Started Today
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#solution"
              className="inline-flex items-center justify-center gap-2 bg-transparent border border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 md:py-28 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              The Hidden Cost of Traditional Exams
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
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
              { icon: Shield, title: 'Security Risks', desc: 'Paper exams are vulnerable to loss, damage, and cheating.' },
            ].map((item, index) => (
              <div
                key={index}
                className="group bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-lg bg-red-100 dark:bg-red-800/30 flex items-center justify-center mb-6 group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
                  <item.icon className="w-7 h-7 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">The Reality Schools Face Today</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">Task</th>
                    <th className="text-right py-4 px-4 text-gray-700 dark:text-gray-300 font-semibold">Current Effort (per exam)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Exam preparation & formatting', '2–5 hours'],
                    ['Printing & distribution', '1–2 hours'],
                    ['Objective grading (manual)', '2–4 hours'],
                    ['Short answer / essay grading', '5–10 hours'],
                    ['Result calculation & report generation', '2–3 hours'],
                  ].map((row, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{row[0]}</td>
                      <td className="py-4 px-4 text-right text-gray-700 dark:text-gray-300 font-medium">{row[1]}</td>
                    </tr>
                  ))}
                  <tr className="bg-indigo-50 dark:bg-indigo-900/30">
                    <td className="py-4 px-4 text-indigo-900 dark:text-indigo-300 font-bold">Total instructor time per exam</td>
                    <td className="py-4 px-4 text-right text-indigo-900 dark:text-indigo-300 font-bold">12–24 hours</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-center mt-8 text-gray-600 dark:text-gray-400 italic max-w-3xl mx-auto">
              Multiply this by the number of exams per semester, per instructor. Your faculty are spending more time on administrative work than on teaching.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-20 md:py-28 bg-gradient-to-b from-indigo-50/80 dark:from-indigo-900/20 to-white dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Introducing Smart Exam Taker
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              An AI-assisted digital examination platform designed for universities, colleges, and schools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: 'AI Document Conversion', desc: 'Convert your exam documents (PDF, Word, PowerPoint) into structured digital exams — no new question writing required.' },
              { icon: Shield, title: 'Secure Digital Exams', desc: 'Conduct exams securely and digitally on students’ devices with identity verification.' },
              { icon: CheckCircle, title: 'Automatic Grading', desc: 'Automatically grades objective questions and uses AI to assist with short answers and essays.' },
              { icon: Users, title: 'Professional Reports', desc: 'Generate professional, branded reports in PDF, Excel, and CSV instantly.' },
              { icon: Clock, title: 'Multi-Institution Support', desc: 'Manage multiple institutions on one platform, each with its own branding and subscription.' },
              { icon: DollarSign, title: 'Cost Effective', desc: 'Eliminate paper & printing costs while reducing instructor workload by 10–20 hours per exam.' },
            ].map((item, index) => (
              <div
                key={index}
                className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-700"
              >
                <div className="w-14 h-14 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-6 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                  <item.icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works – A Simple 4-Step Process
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Optional connecting line (hidden on mobile) */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-indigo-100 dark:bg-indigo-800 -z-10"></div>
            {[
              { step: '1', title: 'Upload Document', desc: 'Upload exam document (PDF, Word, etc.)' },
              { step: '2', title: 'AI Processing', desc: 'AI extracts and structures questions into digital format' },
              { step: '3', title: 'Review & Schedule', desc: 'Instructor reviews, edits, and schedules the exam' },
              { step: '4', title: 'Automatic Results', desc: 'Students take the exam; grading and reports are automatic' },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="relative w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform">
                  {item.step}
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-1/2 left-full w-8 h-0.5 bg-indigo-200 dark:bg-indigo-700"></div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section id="roi" className="py-20 md:py-28 bg-gradient-to-br from-green-50 dark:from-green-900/20 to-emerald-50 dark:to-emerald-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Real-World ROI Example
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">See the savings for yourself</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-xl">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              <strong>Scenario:</strong> A department with 10 instructors, each conducting 3 exams per semester.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-8 border border-red-100 dark:border-red-800">
                <h3 className="text-xl font-semibold text-red-800 dark:text-red-300 mb-6">Current Manual Process</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">~15 hours per exam × 30 exams = <strong>450 hours/semester</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Paper & printing costs: <strong>5,000 ETB – 10,000 ETB per semester</strong></span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8 border border-green-100 dark:border-green-800">
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-6">With Smart Exam Taker</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">~2 hours per exam × 30 exams = <strong>60 hours/semester</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Time saved: <strong>390 hours</strong> (9.75 weeks of full-time work)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Paper & printing savings: <strong>5,000 ETB – 10,000 ETB per semester</strong></span>
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-center mt-10 text-lg text-gray-700 dark:text-gray-300 font-semibold">
              Even at a conservative hourly rate, the system pays for itself within the first semester.
            </p>
          </div>
        </div>
      </section>

      {/* CTA / Registration Section */}
      <section id="register" className="py-20 md:py-28 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Get Started with Smart Exam Taker
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              Login
            </Link>
            . New to Smart Exam Taker?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              Register
            </Link>{' '}
            to continue with us.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all shadow-lg hover:shadow-xl"
          >
            Continue With Us
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Smart Exam Taker</h3>
          <p className="text-gray-400 dark:text-gray-500 mb-6">AI-Assisted Digital Examination Platform</p>

          <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-8 text-gray-300 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 dark:text-gray-500">Phone:</span>
              <span>
                <a href="tel:+251924606710" className="hover:text-indigo-400 dark:hover:text-indigo-300 transition-colors">+251924606710</a>{' '}
                /{' '}
                <a href="tel:+251922583488" className="hover:text-indigo-400 dark:hover:text-indigo-300 transition-colors">+251922583488</a>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 dark:text-gray-500">Email:</span>
              <a href="mailto:yopeman318@gmail.com" className="hover:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                yopeman318@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 dark:text-gray-500">Telegram:</span>
              <a
                href="https://t.me/yope_man"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                @yope_man
              </a>
            </div>
          </div>

          <p className="text-gray-500 dark:text-gray-600 text-sm">
            © {new Date().getFullYear()} Smart Exam Taker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;