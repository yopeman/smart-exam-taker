import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../../lib/apiClient'
import DashboardNavbar from '../../components/DashboardNavbar'
import {
  Plus,
  Building2,
  MapPin,
  Pencil,
  Trash2,
  X,
  Upload,
  Users,
  Share2,
} from 'lucide-react'

function SchoolFormModal({ school, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: school?.name || '',
    location: school?.location || '',
    primary_color: school?.primary_color || '#4f46e5',
    secondary_color: school?.secondary_color || '#9333ea',
    logo_url: school?.logo_url || '',
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(school?.logo_url || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      if (form.location) fd.append('location', form.location)
      if (form.primary_color) fd.append('primary_color', form.primary_color)
      if (form.secondary_color) fd.append('secondary_color', form.secondary_color)
      if (logoFile) {
        fd.append('logo', logoFile)
      } else if (form.logo_url) {
        fd.append('logo_url', form.logo_url)
      }

      if (school) {
        await apiClient.patch(`/schools/${school.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await apiClient.post('/schools', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Failed to save school')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {school ? 'Edit School' : 'Create School'}
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
              Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={150}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Location
            </label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              maxLength={255}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Primary Color
              </label>
              <input
                type="color"
                name="primary_color"
                value={form.primary_color}
                onChange={handleChange}
                className="h-10 w-full rounded-md border border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Secondary Color
              </label>
              <input
                type="color"
                name="secondary_color"
                value={form.secondary_color}
                onChange={handleChange}
                className="h-10 w-full rounded-md border border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Logo
            </label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="logo preview"
                  className="h-14 w-14 rounded-md object-contain"
                />
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <Upload className="h-4 w-4" />
                Upload
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">PNG, JPEG, GIF, or WEBP, up to 5 MB.</p>
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
              {saving ? 'Saving...' : school ? 'Save Changes' : 'Create School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SchoolCard({ school, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      {school.logo_url ? (
        <img
          src={school.logo_url}
          alt={school.name}
          className="h-14 w-14 rounded-md object-contain"
        />
      ) : (
        <div
          className="flex h-14 w-14 items-center justify-center rounded-md text-white"
          style={{ backgroundColor: school.primary_color || '#4f46e5' }}
        >
          <Building2 className="h-7 w-7" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-900 dark:text-white">{school.name}</p>
        {school.location && (
          <p className="flex items-center gap-1 truncate text-sm text-gray-500">
            <MapPin className="h-3 w-3" />
            {school.location}
          </p>
        )}
        <div className="mt-1 flex gap-2">
          {school.primary_color && (
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: school.primary_color }}
            />
          )}
          {school.secondary_color && (
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: school.secondary_color }}
            />
          )}
        </div>
      </div>
      {(onEdit || onDelete) && (
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(school)}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(school)}
              className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function Schools() {
  const [tab, setTab] = useState('owned')
  const [owned, setOwned] = useState([])
  const [shared, setShared] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [o, s] = await Promise.all([
        apiClient.get('/schools'),
        apiClient.get('/schools/shared'),
      ])
      setOwned(o)
      setShared(s)
    } catch (err) {
      setError(err.message || 'Failed to load schools')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSaved = () => {
    setShowForm(false)
    setEditing(null)
    load()
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await apiClient.delete(`/schools/${toDelete.id}`)
      setToDelete(null)
      load()
    } catch (err) {
      setError(err.message || 'Failed to delete school')
    }
  }

  const list = tab === 'owned' ? owned : shared

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar title="Schools" />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Schools</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your institutions and shared access
            </p>
          </div>
          {tab === 'owned' && (
            <button
              onClick={() => {
                setEditing(null)
                setShowForm(true)
              }}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" />
              New School
            </button>
          )}
        </div>

        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTab('owned')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${
              tab === 'owned'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className="h-4 w-4" />
            My Schools ({owned.length})
          </button>
          <button
            onClick={() => setTab('shared')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${
              tab === 'shared'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Share2 className="h-4 w-4" />
            Shared With Me ({shared.length})
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : list.length === 0 ? (
          <div className="rounded-lg bg-white py-12 text-center shadow dark:bg-gray-800">
            {tab === 'owned' ? (
              <>
                <Building2 className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">No schools yet</p>
                <button
                  onClick={() => {
                    setEditing(null)
                    setShowForm(true)
                  }}
                  className="mt-3 text-indigo-600 hover:underline"
                >
                  Create your first school
                </button>
              </>
            ) : (
              <>
                <Users className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  No schools have been shared with you
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map((school) => (
              <SchoolCard
                key={school.id}
                school={school}
                onEdit={
                  tab === 'owned'
                    ? (s) => {
                        setEditing(s)
                        setShowForm(true)
                      }
                    : undefined
                }
                onDelete={tab === 'owned' ? setToDelete : undefined}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <SchoolFormModal
          school={editing}
          onClose={() => {
            setShowForm(false)
            setEditing(null)
          }}
          onSaved={handleSaved}
        />
      )}

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete School</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <span className="font-medium">{toDelete.name}</span>?
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
                onClick={confirmDelete}
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
