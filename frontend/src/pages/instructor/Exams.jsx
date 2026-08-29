import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../../lib/apiClient'
import DashboardNavbar from '../../components/DashboardNavbar'
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Calendar,
  Play,
  CheckCircle,
  XCircle,
  Send,
  FileText,
  Clock,
  X,
} from 'lucide-react'

const STATUS_STYLES = {
  processing: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  started: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  )
}

function ExamFormModal({ schoolId, exam, onClose, onSaved }) {
  const isEdit = Boolean(exam)
  const [form, setForm] = useState({
    title: exam?.title || '',
    description: exam?.description || '',
    department: exam?.department || '',
    year_of_study: exam?.year_of_study || '',
    semester: exam?.semester || '',
    section: exam?.section || '',
    duration_minutes: exam?.duration_minutes || 60,
    max_students: exam?.max_students ?? '',
    max_reserved_students: exam?.max_reserved_students ?? '',
  })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        const payload = {}
        Object.entries(form).forEach(([k, v]) => {
          if (v === '' || v === null) return
          payload[k] = k === 'duration_minutes' ? Number(v) : v
        })
        await apiClient.patch(`/exams/${exam.id}`, payload)
      } else {
        const fd = new FormData()
        fd.append('title', form.title)
        if (form.description) fd.append('description', form.description)
        if (form.department) fd.append('department', form.department)
        if (form.year_of_study) fd.append('year_of_study', Number(form.year_of_study))
        if (form.semester) fd.append('semester', form.semester)
        if (form.section) fd.append('section', form.section)
        fd.append('duration_minutes', Number(form.duration_minutes))
        if (form.max_students !== '' && form.max_students != null)
          fd.append('max_students', Number(form.max_students))
        if (form.max_reserved_students !== '' && form.max_reserved_students != null)
          fd.append('max_reserved_students', Number(form.max_reserved_students))
        if (!file) {
          setError('A document is required to create an exam')
          setSaving(false)
          return
        }
        fd.append('file', file)
        await apiClient.post(`/exams/schools/${schoolId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Failed to save exam')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Exam' : 'Create Exam'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={255}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={2000}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department
              </label>
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                maxLength={150}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Year of Study
              </label>
              <input
                type="number"
                name="year_of_study"
                value={form.year_of_study}
                onChange={handleChange}
                min={1}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Semester
              </label>
              <input
                name="semester"
                value={form.semester}
                onChange={handleChange}
                maxLength={50}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Section
              </label>
              <input
                name="section"
                value={form.section}
                onChange={handleChange}
                maxLength={50}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration (min)
              </label>
              <input
                type="number"
                name="duration_minutes"
                value={form.duration_minutes}
                onChange={handleChange}
                min={1}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Students
              </label>
              <input
                type="number"
                name="max_students"
                value={form.max_students}
                onChange={handleChange}
                min={0}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reserved
              </label>
              <input
                type="number"
                name="max_reserved_students"
                value={form.max_reserved_students}
                onChange={handleChange}
                min={0}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Exam Document
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <Upload className="h-4 w-4" />
                {file ? file.name : 'Choose file (PDF, DOCX, PPTX)'}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Upload the exam document to be converted into structured questions.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ScheduleModal({ exam, onClose, onSaved }) {
  const [scheduledAt, setScheduledAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!scheduledAt) {
      setError('Please choose a date and time')
      return
    }
    setSaving(true)
    try {
      const iso = new Date(scheduledAt).toISOString()
      await apiClient.post(`/exams/${exam.id}/schedule`, {
        scheduled_at: iso,
        timezone: 'UTC',
      })
      onSaved()
    } catch (err) {
      setError(err.message || 'Failed to schedule exam')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Schedule Exam</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Scheduled At
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ExamCard({ exam, onEdit, onAction }) {
  const status = exam.status
  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-gray-900 dark:text-white">{exam.title}</p>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 text-xs text-gray-500">Code: {exam.code}</p>
          {exam.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
              {exam.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
            {exam.department && <span>{exam.department}</span>}
            {exam.year_of_study && <span>Year {exam.year_of_study}</span>}
            {exam.semester && <span>{exam.semester}</span>}
            {exam.section && <span>Sec {exam.section}</span>}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {exam.duration_minutes}m
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
        {status === 'draft' && (
          <button
            onClick={() => onAction('submit', exam)}
            className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs text-white hover:bg-blue-700"
          >
            <Send className="h-3.5 w-3.5" /> Submit
          </button>
        )}
        {(status === 'draft' || status === 'submitted') && (
          <button
            onClick={() => onEdit(exam)}
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
        {status === 'submitted' && (
          <button
            onClick={() => onAction('schedule', exam)}
            className="flex items-center gap-1 rounded-md bg-purple-600 px-2.5 py-1.5 text-xs text-white hover:bg-purple-700"
          >
            <Calendar className="h-3.5 w-3.5" /> Schedule
          </button>
        )}
        {['draft', 'submitted', 'scheduled'].includes(status) && (
          <button
            onClick={() => onAction('start', exam)}
            className="flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1.5 text-xs text-white hover:bg-amber-700"
          >
            <Play className="h-3.5 w-3.5" /> Start
          </button>
        )}
        {status === 'started' && (
          <button
            onClick={() => onAction('complete', exam)}
            className="flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1.5 text-xs text-white hover:bg-green-700"
          >
            <CheckCircle className="h-3.5 w-3.5" /> Complete
          </button>
        )}
        {!['completed', 'cancelled', 'processing'].includes(status) && (
          <button
            onClick={() => onAction('cancel', exam)}
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <XCircle className="h-3.5 w-3.5" /> Cancel
          </button>
        )}
        <button
          onClick={() => onAction('delete', exam)}
          className="ml-auto flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </div>
  )
}

export default function Exams() {
  const [schools, setSchools] = useState([])
  const [selectedSchool, setSelectedSchool] = useState('')
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [scheduling, setScheduling] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  useEffect(() => {
    apiClient
      .get('/schools')
      .then((data) => {
        setSchools(data)
        if (data.length > 0) setSelectedSchool(data[0].id)
      })
      .catch((err) => setError(err.message || 'Failed to load schools'))
  }, [])

  const loadExams = useCallback(async () => {
    if (!selectedSchool) {
      setExams([])
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await apiClient.get(`/exams/schools/${selectedSchool}`)
      setExams(data)
    } catch (err) {
      setError(err.message || 'Failed to load exams')
    } finally {
      setLoading(false)
    }
  }, [selectedSchool])

  useEffect(() => {
    loadExams()
  }, [loadExams])

  const handleSaved = () => {
    setShowForm(false)
    setEditing(null)
    setScheduling(null)
    loadExams()
  }

  const handleAction = async (action, exam) => {
    try {
      if (action === 'schedule') {
        setScheduling(exam)
        return
      }
      if (action === 'delete') {
        if (!window.confirm(`Delete exam "${exam.title}"? This cannot be undone.`)) return
        await apiClient.delete(`/exams/${exam.id}`)
      } else if (action === 'start') {
        await apiClient.post(`/exams/${exam.id}/start`)
      } else if (action === 'complete') {
        await apiClient.post(`/exams/${exam.id}/complete`)
      } else if (action === 'cancel') {
        if (!window.confirm(`Cancel exam "${exam.title}"?`)) return
        await apiClient.post(`/exams/${exam.id}/cancel`)
      } else if (action === 'submit') {
        await apiClient.post(`/exams/${exam.id}/submit`)
      }
      loadExams()
    } catch (err) {
      setError(err.message || 'Action failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar title="Exams" />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Exams</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Create and manage exams for your schools
            </p>
          </div>
          {selectedSchool && (
            <button
              onClick={() => {
                setEditing(null)
                setShowForm(true)
              }}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" />
              New Exam
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            School
          </label>
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {schools.length === 0 && <option value="">No schools available</option>}
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : exams.length === 0 ? (
          <div className="rounded-lg bg-white py-12 text-center shadow dark:bg-gray-800">
            <FileText className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">No exams for this school yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onEdit={(e) => {
                  setEditing(e)
                  setShowForm(true)
                }}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && selectedSchool && (
        <ExamFormModal
          schoolId={selectedSchool}
          exam={editing}
          onClose={() => {
            setShowForm(false)
            setEditing(null)
          }}
          onSaved={handleSaved}
        />
      )}

      {scheduling && (
        <ScheduleModal
          exam={scheduling}
          onClose={() => setScheduling(null)}
          onSaved={handleSaved}
        />
      )}

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Exam</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <span className="font-medium">{toDelete.title}</span>?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setToDelete(null)}
                className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleAction('delete', toDelete)
                  setToDelete(null)
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
