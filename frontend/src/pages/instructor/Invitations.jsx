import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../../lib/apiClient'
import DashboardNavbar from '../../components/DashboardNavbar'
import {
  Plus,
  Mail,
  Check,
  X,
  Send,
  Ban,
  Trash2,
  Inbox,
  UserPlus,
} from 'lucide-react'

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  canceled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.pending
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function InviteModal({ schools, onClose, onCreated }) {
  const [schoolId, setSchoolId] = useState(schools[0]?.id || '')
  const [email, setEmail] = useState('')
  const [maxExams, setMaxExams] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await apiClient.post(`/invitations/schools/${schoolId}`, {
        instructor_email: email,
        max_exams: Number(maxExams),
      })
      onCreated()
    } catch (err) {
      setError(err.message || 'Failed to send invitation')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Invite Instructor
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
              School
            </label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Instructor Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Max Exams
            </label>
            <input
              type="number"
              min={1}
              value={maxExams}
              onChange={(e) => setMaxExams(e.target.value)}
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
              {saving ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Invitations() {
  const [tab, setTab] = useState('mine')
  const [mine, setMine] = useState([])
  const [created, setCreated] = useState([])
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInvite, setShowInvite] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [m, c, s] = await Promise.all([
        apiClient.get('/invitations/me'),
        apiClient.get('/invitations/created'),
        apiClient.get('/schools'),
      ])
      setMine(m)
      setCreated(c)
      setSchools(s)
    } catch (err) {
      setError(err.message || 'Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const act = async (id, action) => {
    setError('')
    try {
      if (action === 'delete') {
        await apiClient.delete(`/invitations/${id}`)
      } else if (action === 'accept') {
        await apiClient.post(`/invitations/${id}/accept`)
      } else if (action === 'reject') {
        await apiClient.post(`/invitations/${id}/reject`)
      } else if (action === 'cancel') {
        await apiClient.post(`/invitations/${id}/cancel`)
      } else if (action === 'resend') {
        await apiClient.patch(`/invitations/${id}`, { resend: true })
      }
      load()
    } catch (err) {
      setError(err.message || 'Action failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar title="Invitations" />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invitations</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Invite instructors or respond to invitations you have received
            </p>
          </div>
          {tab === 'created' && schools.length > 0 && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" />
              Invite Instructor
            </button>
          )}
        </div>

        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTab('mine')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${
              tab === 'mine'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Inbox className="h-4 w-4" />
            My Invitations ({mine.length})
          </button>
          <button
            onClick={() => setTab('created')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${
              tab === 'created'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Sent Invitations ({created.length})
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : tab === 'mine' ? (
          mine.length === 0 ? (
            <div className="rounded-lg bg-white py-12 text-center shadow dark:bg-gray-800">
              <Inbox className="mx-auto mb-3 h-12 w-12 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">No invitations for you</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mine.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {inv.school_id}
                    </p>
                    <p className="text-sm text-gray-500">
                      {inv.max_exams} exam{inv.max_exams > 1 ? 's' : ''} · Expires{' '}
                      {formatDate(inv.expired_at)}
                    </p>
                  </div>
                  <StatusBadge status={inv.status} />
                  {inv.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => act(inv.id, 'accept')}
                        className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => act(inv.id, 'reject')}
                        className="flex items-center gap-1 rounded-md bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : created.length === 0 ? (
          <div className="rounded-lg bg-white py-12 text-center shadow dark:bg-gray-800">
            <UserPlus className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">No invitations sent yet</p>
            {schools.length === 0 && (
              <p className="mt-1 text-sm text-gray-400">Create a school first to invite instructors.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {created.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {inv.school_name} · <span className="text-gray-500">{inv.instructor_email}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {inv.max_exams} exam{inv.max_exams > 1 ? 's' : ''} · Sent{' '}
                    {formatDate(inv.invited_at)}
                  </p>
                </div>
                <StatusBadge status={inv.status} />
                <div className="flex gap-2">
                  {inv.status === 'pending' && (
                    <>
                      <button
                        onClick={() => act(inv.id, 'resend')}
                        className="flex items-center gap-1 rounded-md bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
                        title="Resend"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => act(inv.id, 'cancel')}
                        className="flex items-center gap-1 rounded-md bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
                        title="Cancel"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => act(inv.id, 'delete')}
                    className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showInvite && (
        <InviteModal
          schools={schools}
          onClose={() => setShowInvite(false)}
          onCreated={() => {
            setShowInvite(false)
            load()
          }}
        />
      )}
    </div>
  )
}
