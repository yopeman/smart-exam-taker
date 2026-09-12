import { Link } from 'react-router-dom'
import {
  Download,
  Monitor,
  Smartphone,
  FileType2,
  ArrowLeft,
} from 'lucide-react'
import ThemeToggle from '../../components/ThemeToggle';

const buildFiles = {
  desktop: [
    {
      name: 'Debian / Ubuntu',
      description: 'Linux (64-bit) — .deb package',
      file: '/desktop/linux/debian/app.deb',
      format: 'DEB',
    },
    {
      name: 'Red Hat / Fedora',
      description: 'Linux (64-bit) — .rpm package',
      file: '/desktop/linux/rpm/app.rpm',
      format: 'RPM',
    },
    {
      name: 'Windows',
      description: 'Windows (64-bit) — installer',
      file: '/desktop/windows/app.exe',
      format: 'EXE',
    },
    {
      name: 'macOS',
      description: 'macOS — disk image',
      file: '/desktop/macos/app.dmg',
      format: 'DMG',
    },
  ],
  mobile: [
    {
      name: 'Android',
      description: 'Android — APK package',
      file: '/mobile/android/app.apk',
      format: 'APK',
    },
    {
      name: 'iOS',
      description: 'iOS — app archive (IPA)',
      file: '/mobile/ios/app.ipa',
      format: 'IPA',
    },
  ],
};

function PlatformSection({ title, icon: Icon, items }) {
  return (
    <section className="py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {items.map((item) => (
            <div
              key={item.file}
              className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                  <FileType2 className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                  {item.format}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{item.name}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{item.description}</p>
              <a
                href={item.file}
                download
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium text-sm hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all"
              >
                Download
                <Download className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DownloadPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Sticky Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            Smart Exam Taker
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              Login
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-blue-100 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Download Smart Exam Taker</h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Get the Smart Exam Taker app on your desktop or mobile device. Choose your platform below.
          </p>
        </div>
      </section>

      {/* Desktop */}
      <PlatformSection title="Desktop" icon={Monitor} items={buildFiles.desktop} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
      </div>

      {/* Mobile */}
      <PlatformSection title="Mobile" icon={Smartphone} items={buildFiles.mobile} />

      <footer className="bg-gray-900 dark:bg-black text-white py-8 mt-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 dark:text-gray-600 text-sm">
            © {new Date().getFullYear()} Smart Exam Taker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default DownloadPage