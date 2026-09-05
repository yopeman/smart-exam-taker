import { useState, useEffect, useMemo } from 'react'
import { apiClient } from '../../lib/apiClient'
import DashboardNavbar from '../../components/DashboardNavbar'
import { usePagination, Pagination } from '../../components/Pagination'
import {
  ClipboardList,
  User as UserIcon,
  ChevronRight,
  X,
  Search,
  Download,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const ATTEMPT_STATUS_STYLES = {
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  processing: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  graded: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

function AttemptStatusBadge({ status }) {
  const style = ATTEMPT_STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  )
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString()
}

function renderAnswer(detail) {
  const { type, answer } = detail
  if (type === 'short_answer' || type === 'essay') {
    return answer == null || answer === '' ? (
      <span className="italic text-gray-400">No answer submitted</span>
    ) : (
      <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{String(answer)}</p>
    )
  }
  if (type === 'true_false') {
    return (
      <span className="text-gray-800 dark:text-gray-200">
        {answer === true ? 'True' : answer === false ? 'False' : '—'}
      </span>
    )
  }
  if (type === 'matching' && answer && typeof answer === 'object') {
    return (
      <span className="text-gray-800 dark:text-gray-200">
        {Object.entries(answer)
          .map(([l, r]) => `${l}→${r}`)
          .join(', ')}
      </span>
    )
  }
  if (answer == null) {
    return <span className="italic text-gray-400">No answer submitted</span>
  }
  if (Array.isArray(answer)) {
    return (
      <span className="text-gray-800 dark:text-gray-200">
        {answer.map((a) => String(a)).join(', ')}
      </span>
    )
  }
  return <span className="text-gray-800 dark:text-gray-200">{String(answer)}</span>
}

function readOnlyField(label, value) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}

function flattenExamQuestions(exam) {
  const map = {}
  ;(exam?.questions?.questions || []).forEach((group) => {
    ;(group.questions || []).forEach((q) => {
      map[q.id] = q
    })
  })
  return map
}

function renderCorrectAnswer(q) {
  if (!q) return <span className="italic text-gray-400">Unknown</span>
  const inner = q.question || q
  switch (inner.type) {
    case 'mcq':
      return (
        <span>
          {inner.correct_answer}
          {inner.options && (
            <span className="text-gray-500">
              {' — '}
              {inner.options.find((o) => o.letter === inner.correct_answer)?.option}
            </span>
          )}
        </span>
      )
    case 'true_false':
      return <span>{inner.correct_answer ? 'True' : 'False'}</span>
    case 'matching':
      return (
        <span>
          {Object.entries(inner.correct_mapping || {})
            .map(([l, r]) => `${l}→${r}`)
            .join(', ')}
        </span>
      )
    case 'blank_space':
      return <span>{Array.isArray(inner.correct_answers) ? inner.correct_answers.join(', ') : String(inner.correct_answers)}</span>
    case 'short_answer':
    case 'essay':
      return (
        <span className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
          {String(inner.correct_answer ?? '—')}
        </span>
      )
    default:
      return <span>{String(inner.correct_answer ?? inner.correct_answers ?? '—')}</span>
  }
}

function deriveCorrectness(detail, score) {
  const val = score === '' || score == null ? 0 : Number(score) || 0
  const max = Number(detail.point ?? detail.points) || 0
  if (max <= 0) return detail.correctness || 'incorrect'
  if (val >= max) return 'correct'
  if (val > 0) return 'partial'
  return 'incorrect'
}

function exportStamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`
}

function escapeCSV(value) {
  const s = String(value ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadText(filename, mime, content) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const EXPORT_TABLE_OPTIONS = [
  {
    key: 'student',
    label: 'Student Name',
    value: (a) => `${a.student_first_name} ${a.student_last_name}`.trim(),
  },
  { key: 'student_id', label: 'ID Number', value: (a) => a.student_id_number },
  { key: 'department', label: 'Department', value: (a) => a.department || '' },
  { key: 'section', label: 'Section', value: (a) => a.section || '' },
  {
    key: 'year_semester',
    label: 'Year / Semester',
    value: (a) => `${a.year_of_study || ''} / ${a.semester || ''}`,
  },
  {
    key: 'school',
    label: 'School',
    value: (a, exam) => exam?.school?.name || '',
  },
  { key: 'exam_title', label: 'Exam Title', value: (a, exam) => exam?.title || '' },
  { key: 'exam_code', label: 'Exam Code', value: (a, exam) => exam?.code || '' },
  { key: 'status', label: 'Status', value: (a) => a.status },
  {
    key: 'objective_score',
    label: 'Objective Score',
    value: (a) => (a.objective_score ?? ''),
  },
  { key: 'ai_score', label: 'AI Score', value: (a) => (a.ai_score ?? '') },
  { key: 'total_score', label: 'Total Score', value: (a) => (a.total_score ?? '') },
  { key: 'started_at', label: 'Started', value: (a) => formatDate(a.started_at) },
  { key: 'submitted_at', label: 'Submitted', value: (a) => formatDate(a.submitted_at) },
  { key: 'graded_at', label: 'Graded', value: (a) => formatDate(a.graded_at) },
]

const EXPORT_PDF_OPTIONS = [
  {
    key: 'school',
    label: 'School',
    value: (a, exam) =>
      [exam?.school?.name, exam?.school?.location].filter(Boolean).join(', ') || '—',
  },
  {
    key: 'exam',
    label: 'Exam',
    value: (a, exam) => `${exam?.title || 'Unknown exam'} (${exam?.code || '—'})`,
  },
  {
    key: 'student',
    label: 'Student Name',
    value: (a) => `${a.student_first_name} ${a.student_last_name}`.trim() || '—',
  },
  { key: 'student_id', label: 'ID Number', value: (a) => a.student_id_number || '—' },
  { key: 'department', label: 'Department', value: (a) => a.department || '—' },
  { key: 'section', label: 'Section', value: (a) => a.section || '—' },
  {
    key: 'year_semester',
    label: 'Year / Semester',
    value: (a) => `${a.year_of_study || '—'} / ${a.semester || '—'}`,
  },
  { key: 'status', label: 'Status', value: (a) => a.status },
  {
    key: 'objective_score',
    label: 'Objective Score',
    value: (a) => (a.objective_score ?? '—'),
  },
  { key: 'ai_score', label: 'AI Score', value: (a) => (a.ai_score ?? '—') },
  { key: 'total_score', label: 'Total Score', value: (a) => (a.total_score ?? '—') },
  { key: 'started_at', label: 'Started', value: (a) => formatDate(a.started_at) },
  { key: 'submitted_at', label: 'Submitted', value: (a) => formatDate(a.submitted_at) },
  { key: 'graded_at', label: 'Graded', value: (a) => formatDate(a.graded_at) },
  { key: 'answers', label: 'Answers & Grading', value: null },
]

function exportCSV(attempts, examMap, columns) {
  const lines = []
  lines.push(columns.map((c) => escapeCSV(c.label)).join(','))
  attempts.forEach((a) => {
    const exam = examMap[a.exam_id]
    lines.push(columns.map((c) => escapeCSV(c.value(a, exam))).join(','))
  })
  downloadText(`attempts_${exportStamp()}.csv`, 'text/csv', lines.join('\r\n'))
}

function exportXLS(attempts, examMap, columns) {
  const rows = [
    columns.map((c) => c.label),
    ...attempts.map((a) => {
      const exam = examMap[a.exam_id]
      return columns.map((c) => c.value(a, exam))
    }),
  ]
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Attempts')
  XLSX.writeFile(wb, `attempts_${exportStamp()}.xlsx`)
}

function correctAnswerText(q) {
  if (!q) return 'Unknown'
  const inner = q.question || q
  switch (inner.type) {
    case 'mcq': {
      const option = (inner.options || []).find((o) => o.letter === inner.correct_answer)
      return option ? `${inner.correct_answer} — ${option.option}` : String(inner.correct_answer ?? '—')
    }
    case 'true_false':
      return inner.correct_answer ? 'True' : 'False'
    case 'matching':
      return Object.entries(inner.correct_mapping || {})
        .map(([l, r]) => `${l}→${r}`)
        .join(', ')
    case 'blank_space':
      return Array.isArray(inner.correct_answers)
        ? inner.correct_answers.join(', ')
        : String(inner.correct_answers ?? '—')
    case 'short_answer':
    case 'essay':
      return String(inner.correct_answer ?? '—')
    default:
      return String(inner.correct_answer ?? inner.correct_answers ?? '—')
  }
}

function studentAnswerText(d) {
  const { type, answer } = d
  if (type === 'short_answer' || type === 'essay') {
    return answer == null || answer === '' ? 'No answer submitted' : String(answer)
  }
  if (type === 'true_false') {
    return answer === true ? 'True' : answer === false ? 'False' : '—'
  }
  if (type === 'matching' && answer && typeof answer === 'object') {
    return Object.entries(answer)
      .map(([l, r]) => `${l}→${r}`)
      .join(', ')
  }
  if (answer == null) return 'No answer submitted'
  if (Array.isArray(answer)) return answer.map(String).join(', ')
  return String(answer)
}

async function loadImageData(url) {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) return null
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const CORRECTNESS_COLORS = {
  correct: '#16a34a',
  partial: '#d97706',
  incorrect: '#dc2626',
}

async function exportPDF(attempts, examMap, options) {
  const doc = new jsPDF()
  const opts = new Set(options.map((o) => o.key))
  const has = (k) => opts.has(k)

  for (let i = 0; i < attempts.length; i++) {
    const a = attempts[i]
    if (i > 0) doc.addPage()
    const exam = examMap[a.exam_id]
    const school = exam?.school
    const accent = school?.primary_color || '#4f46e5'
    let y = 12

    if (has('school') || has('exam')) {
      doc.setFillColor(accent)
      doc.rect(10, y, 2, 34, 'F')

      let logoData = null
      if (has('school') && school?.logo_url) {
        logoData = await loadImageData(school.logo_url)
      }

      const textX = logoData ? 46 : 30
      if (logoData) {
        const fmt = logoData.startsWith('data:image/png') ? 'PNG' : 'JPEG'
        doc.setDrawColor(190)
        doc.addImage(logoData, fmt, 14, y + 2, 28, 28, undefined, 'FAST')
        doc.rect(14, y + 2, 28, 28)
      } else if (has('school') && school?.name) {
        doc.setFillColor(accent)
        doc.roundedRect(14, y + 4, 24, 24, 3, 3, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
        doc.setTextColor(255)
        doc.text(school.name.charAt(0).toUpperCase(), 26, y + 20, { align: 'center' })
      }

      let cy = y + 7
      if (has('school') && school?.name) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        doc.setTextColor(20)
        doc.text(school.name, textX, cy)
        cy += 6
      }
      if (has('school') && school?.location) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(120)
        doc.text(school.location, textX, cy)
        cy += 6
      }
      if (has('exam')) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(20)
        doc.text(
          `${exam?.title || 'Unknown exam'}${exam?.code ? `  (${exam.code})` : ''}`,
          textX,
          cy
        )
      }
      y += 40
    }

    if (a.student_face_url) {
      const faceData = await loadImageData(a.student_face_url)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text('CAPTURED FACE', 14, y)
      y += 2
      if (faceData) {
        const fmt = faceData.startsWith('data:image/png') ? 'PNG' : 'JPEG'
        doc.setDrawColor(150)
        doc.addImage(faceData, fmt, 14, y, 40, 40, undefined, 'FAST')
        doc.rect(14, y, 40, 40)
      } else {
        doc.setDrawColor(150)
        doc.roundedRect(14, y, 40, 40, 2, 2, 'S')
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8)
        doc.setTextColor(120)
        doc.text('(image unavailable)', 34, y + 20, { align: 'center' })
      }
      y += 46
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(120)
      doc.text(
        `Captured: ${a.face_captured_at ? formatDate(a.face_captured_at) : '—'}`,
        14,
        y
      )
      y += 7
    }

    const pairs = [
      ['Student', has('student') ? `${a.student_first_name} ${a.student_last_name}`.trim() || '—' : null],
      ['ID Number', has('student_id') ? a.student_id_number || '—' : null],
      ['Department', has('department') ? a.department || '—' : null],
      ['School', has('school') ? school?.name || '—' : null],
      [
        'Year / Semester / Section',
        has('year_semester')
          ? `${a.year_of_study || '—'} / ${a.semester || '—'} / ${a.section || '—'}`
          : null,
      ],
      ['Status', has('status') ? a.status : null],
    ]
    const gridRows = []
    for (let r = 0; r < pairs.length; r += 2) {
      const left = pairs[r]
      const right = pairs[r + 1]
      const cell = (v) => ({ content: v, styles: { fontSize: 10 } })
      const label = (l) => ({
        content: l.toUpperCase(),
        styles: { fontStyle: 'bold', fontSize: 8, textColor: [120, 120, 120] },
      })
      gridRows.push([
        label(left[0]),
        cell(left[1] ?? ''),
        label(right ? right[0] : ''),
        cell(right ? (right[1] ?? '') : ''),
      ])
    }
    if (gridRows.length > 0) {
      autoTable(doc, {
        startY: y,
        theme: 'grid',
        body: gridRows,
        margin: { left: 10, right: 10 },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 62 },
          2: { cellWidth: 32 },
          3: { cellWidth: 58 },
        },
      })
      y = doc.lastAutoTable.finalY + 6
    }

    const scoreCols = [
      ['Objective', has('objective_score') ? a.objective_score : null],
      ['AI', has('ai_score') ? a.ai_score : null],
      ['Total', has('total_score') ? a.total_score : null],
    ].filter(([, v]) => v !== null)
    if (scoreCols.length > 0) {
      autoTable(doc, {
        startY: y,
        theme: 'grid',
        head: [scoreCols.map(([l]) => l)],
        body: [scoreCols.map(([, v]) => String(v ?? '—'))],
        styles: { halign: 'center', fontSize: 13 },
        headStyles: { fillColor: accent, fontSize: 9 },
        margin: { left: 10, right: 10 },
      })
      y = doc.lastAutoTable.finalY + 6
    }

    const timeline = [
      ['Started', has('started_at') ? formatDate(a.started_at) : null],
      ['Submitted', has('submitted_at') ? formatDate(a.submitted_at) : null],
      ['Graded', has('graded_at') ? formatDate(a.graded_at) : null],
    ].filter(([, v]) => v)
    if (timeline.length > 0) {
      autoTable(doc, {
        startY: y,
        theme: 'plain',
        body: timeline.map(([l, v]) => [
          { content: l, styles: { fontStyle: 'bold', fontSize: 10 } },
          { content: v, styles: { fontSize: 10 } },
        ]),
        columnStyles: { 0: { cellWidth: 30 } },
        margin: { left: 10, right: 10 },
      })
      y = doc.lastAutoTable.finalY + 6
    }

    const details = a.grading_details || []
    if (has('answers') && details.length > 0) {
      const questionMap = flattenExamQuestions(exam)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(20)
      doc.text('Answers & Grading', 14, y)
      y += 2

      const labelCell = (l) => ({
        content: l.toUpperCase(),
        styles: { fontStyle: 'bold', fontSize: 8, textColor: [140, 140, 140] },
      })

      details.forEach((d, di) => {
        const q = questionMap[d.question_id]
        const inner = q?.question || q
        const questionTitle =
          (q ? inner?.question || q.id : d.question_id) || `Q${d.index + 1}`
        const correctness = d.correctness || 'incorrect'
        const cColor = CORRECTNESS_COLORS[correctness] || CORRECTNESS_COLORS.incorrect
        const point = d.point ?? d.points
        const correctnessLabel =
          correctness === 'correct'
            ? 'CORRECT'
            : correctness === 'partial'
              ? 'PARTIAL'
              : 'INCORRECT'

        autoTable(doc, {
          startY: y,
          theme: 'grid',
          styles: { fontSize: 9 },
          margin: { left: 10, right: 10 },
          body: [
            [
              { content: `#${di + 1}  ${questionTitle}`, styles: { fontStyle: 'bold', fontSize: 10 } },
              {
                content: `${correctnessLabel} · ${point} pts`,
                styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, textColor: cColor },
              },
            ],
            [
              labelCell('Question ID'),
              { content: q?.id ? String(q.id) : '—', styles: { fontSize: 9 } },
            ],
            [
              labelCell('Correct Answer'),
              { content: correctAnswerText(q), styles: { fontSize: 9 } },
            ],
            [
              labelCell('Student Answer'),
              { content: studentAnswerText(d), styles: { fontSize: 9 } },
            ],
            [
              labelCell('Feedback'),
              {
                content: d.feedback != null ? d.feedback : '—',
                styles: { fontSize: 9 },
              },
            ],
            [
              { content: 'SCORE', styles: { fontStyle: 'bold', fontSize: 9 } },
              {
                content: `${Number(d.score ?? 0).toFixed(1)} / ${point}`,
                styles: { halign: 'right', fontSize: 9 },
              },
            ],
          ],
          columnStyles: { 0: { cellWidth: 38 } },
        })
        y = doc.lastAutoTable.finalY + 6
      })
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(130)
    doc.text(`Attempt ${i + 1} of ${attempts.length}`, 105, 291, { align: 'center' })
  }

  doc.save(`attempts_${exportStamp()}.pdf`)
}

function ExportModal({ attempts, examMap, onClose }) {
  const [format, setFormat] = useState('csv')
  const initialKeys = (opts) => opts.map((o) => o.key)
  const [selected, setSelected] = useState(() => initialKeys(EXPORT_TABLE_OPTIONS))

  const options = format === 'pdf' ? EXPORT_PDF_OPTIONS : EXPORT_TABLE_OPTIONS

  const changeFormat = (f) => {
    setFormat(f)
    setSelected(initialKeys(f === 'pdf' ? EXPORT_PDF_OPTIONS : EXPORT_TABLE_OPTIONS))
  }

  const toggle = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const runExport = async () => {
    const columns = options.filter((o) => selected.includes(o.key))
    if (format === 'csv') exportCSV(attempts, examMap, columns)
    else if (format === 'xls') exportXLS(attempts, examMap, columns)
    else await exportPDF(attempts, examMap, columns)
    onClose()
  }

  const formats = [
    { key: 'csv', title: 'CSV', desc: 'Comma-separated table' },
    { key: 'xls', title: 'Excel', desc: 'Same columns as CSV, real .xlsx file' },
    { key: 'pdf', title: 'PDF', desc: 'One page per attempt with detailed content' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Export Attempts
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          {formats.map((f) => (
            <button
              key={f.key}
              onClick={() => changeFormat(f.key)}
              className={`flex-1 rounded-md border px-3 py-2 text-left text-sm transition ${
                format === f.key
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'border-gray-300 hover:border-indigo-300 dark:border-gray-600'
              }`}
            >
              <span className="font-medium text-gray-900 dark:text-white">{f.title}</span>
              <span className="block text-xs text-gray-500">{f.desc}</span>
            </button>
          ))}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Columns to include
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {options.map((o) => (
              <label
                key={o.key}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-600"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(o.key)}
                  onChange={() => toggle(o.key)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-900 dark:text-white">{o.label}</span>
              </label>
            ))}
          </div>
        </div>

        {selected.length === 0 && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            Select at least one column to export.
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Exporting {attempts.length} attempt{attempts.length === 1 ? '' : 's'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={runExport}
              disabled={selected.length === 0}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AttemptDetail({ attempt, exam, onClose, onSaved }) {
  const [scores, setScores] = useState(
    (attempt.grading_details || []).map((d) => (d.score != null ? d.score : 0))
  )
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const details = attempt.grading_details || []
  const hasDetails = details.length > 0

  const questionMap = useMemo(() => flattenExamQuestions(exam), [exam])

  const objectiveTypes = ['mcq', 'true_false', 'matching', 'blank_space']

  const computed = useMemo(() => {
    let objective = 0
    let ai = 0
    details.forEach((d, i) => {
      const s = Number(scores[i]) || 0
      if (objectiveTypes.includes(d.type)) objective += s
      else if (d.type === 'short_answer' || d.type === 'essay') ai += s
      else objective += s
    })
    return { objective, ai, total: objective + ai }
  }, [details, scores])

  const updateScore = (idx, value) => {
    const next = [...scores]
    next[idx] = value === '' ? '' : Number(value)
    setScores(next)
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    setError('')
    try {
      const updatedDetails = details.map((d, i) => ({
        ...d,
        score: scores[i] === '' ? 0 : Number(scores[i]),
        correctness: deriveCorrectness(d, scores[i]),
      }))
      const saved = await apiClient.patch(`/attempts/${attempt.id}/scores`, {
        grading_details: updatedDetails,
        objective_score: computed.objective,
        ai_score: computed.ai,
        total_score: computed.total,
      })
      setMsg('Scores updated successfully')
      if (onSaved) onSaved(saved)
    } catch (err) {
      setError(err.message || 'Failed to save scores')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Attempt Details
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div
            className="flex items-center gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-700/40"
            style={
              exam?.school?.primary_color
                ? { borderLeft: `4px solid ${exam.school.primary_color}` }
                : undefined
            }
          >
            {exam?.school?.logo_url ? (
              <img
                src={exam.school.logo_url}
                alt={exam.school.name || 'School logo'}
                className="w-24 rounded-md border border-gray-200 bg-white object-contain dark:border-gray-600"
                style={
                  exam?.school?.primary_color
                    ? { borderColor: exam.school.primary_color }
                    : undefined
                }
              />
            ) : exam?.school?.name ? (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-md text-lg font-bold text-white"
                style={{
                  backgroundColor: exam.school.primary_color || '#4f46e5',
                }}
              >
                {exam.school.name.charAt(0).toUpperCase()}
              </div>
            ) : null}
            <div className="min-w-0">
              {exam?.school?.name && (
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {exam.school.name}
                </p>
              )}
              {exam?.school?.location && (
                <p className="text-xs text-gray-500">{exam.school.location}</p>
              )}
              <p className="font-medium text-gray-900 dark:text-white">
                {exam?.title || 'Unknown exam'}{' '}
                <span className="text-xs text-gray-500">({exam?.code})</span>
              </p>
            </div>
          </div>

          {attempt.student_face_url && (
            <div>
              <p className="mb-1 text-xs text-gray-500">Captured Face</p>
              <img
                src={attempt.student_face_url}
                alt={`${attempt.student_first_name} ${attempt.student_last_name}`}
                className="h-28 w-28 rounded-md border border-gray-200 object-cover dark:border-gray-600"
              />
              <p className="mt-1 text-xs text-gray-500">
                Captured: {formatDate(attempt.face_captured_at)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-700/40">
            {readOnlyField(
              'Student',
              `${attempt.student_first_name} ${attempt.student_last_name}`
            )}
            {readOnlyField('ID Number', attempt.student_id_number)}
            {readOnlyField('Department', attempt.department || '—')}
            {readOnlyField('School', exam?.school?.name || '—')}
            {readOnlyField(
              'Year / Semester / Section',
              `${attempt.year_of_study || '—'} / ${attempt.semester || '—'} / ${
                attempt.section || '—'
              }`
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md bg-gray-50 p-2 dark:bg-gray-700/40">
              <p className="text-xs text-gray-500">Objective</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {computed.objective}
              </p>
            </div>
            <div className="rounded-md bg-gray-50 p-2 dark:bg-gray-700/40">
              <p className="text-xs text-gray-500">AI</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {computed.ai}
              </p>
            </div>
            <div className="rounded-md bg-gray-50 p-2 dark:bg-gray-700/40">
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {computed.total}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs text-gray-500">Timeline</p>
            <p className="text-gray-900 dark:text-white">
              Started: {formatDate(attempt.started_at)}
            </p>
            <p className="text-gray-900 dark:text-white">
              Submitted: {formatDate(attempt.submitted_at)}
            </p>
            <p className="text-gray-900 dark:text-white">
              Graded: {formatDate(attempt.graded_at)}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs text-gray-500">
              Answers &amp; Grading
            </p>
{hasDetails ? (
              <div className="space-y-3">
                {details.map((d, i) => {
                          const q = questionMap[d.question_id]
                          const inner = q?.question || q
                          const liveCorrectness = deriveCorrectness(d, scores[i])
                          return (
                            <div
                              key={i}
                              className="rounded-md border border-gray-200 p-3 dark:border-gray-600"
                            >
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {q ? inner?.question || q.id : d.question_id || `Q${d.index + 1}`}
                                  <span className="ml-2 text-xs font-normal text-gray-500">
                                    {d.type} · {d.point ?? d.points} pts
                                  </span>
                                </p>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    liveCorrectness === 'correct'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                      : liveCorrectness === 'partial'
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                  }`}
                                >
                                  {liveCorrectness === 'correct'
                                    ? 'Correct'
                                    : liveCorrectness === 'partial'
                                      ? 'Partial'
                                      : 'Incorrect'}
                                </span>
                              </div>

                      {q && (
                        <p className="mb-2 break-all text-xs text-gray-400">{q.id}</p>
                      )}

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-xs text-gray-500">Correct Answer</p>
                          <div className="rounded bg-gray-50 p-2 text-xs text-gray-900 dark:bg-gray-700/40 dark:text-white">
                            {renderCorrectAnswer(q)}
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-xs text-gray-500">Student Answer</p>
                          <div className="rounded bg-gray-50 p-2 text-xs dark:bg-gray-700/40">
                            {renderAnswer(d)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="mb-1 text-xs text-gray-500">Feedback</p>
                        <p className="rounded bg-gray-50 p-2 text-xs text-gray-800 dark:bg-gray-700/40 dark:text-gray-200">
                          {d.feedback != null ? d.feedback : '—'}
                        </p>
                      </div>

                      <label className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-500">Score</span>
                        <input
                          type="number"
                          step="0.01"
                          value={scores[i]}
                          onChange={(e) => updateScore(i, e.target.value)}
                          className="w-28 rounded border border-gray-300 bg-white px-2 py-1 text-right text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </label>
                    </div>
                  )
                })}
              </div>
            ) : (
              <pre className="max-h-60 overflow-auto rounded-md bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-700/40 dark:text-gray-200">
                {JSON.stringify(attempt.answers, null, 2)}
              </pre>
            )}
          </div>

          {msg && (
            <div className="rounded-md bg-green-50 p-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
              {msg}
            </div>
          )}
          {error && (
            <div className="rounded-md bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Scores'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Attempts() {
  const [attempts, setAttempts] = useState([])
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterExam, setFilterExam] = useState('')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const [showExport, setShowExport] = useState(false)

  const handleSaved = (saved) => {
    setAttempts((prev) =>
      prev.map((a) => (a.id === saved.id ? saved : a))
    )
    setDetail(saved)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([apiClient.get('/attempts/reachable'), apiClient.get('/exams/reachable')])
      .then(([atts, exs]) => {
        setAttempts(atts)
        setExams(exs)
      })
      .catch((err) => setError(err.message || 'Failed to load attempts'))
      .finally(() => setLoading(false))
  }, [])

  const examMap = useMemo(() => {
    const m = {}
    exams.forEach((e) => {
      m[e.id] = e
    })
    return m
  }, [exams])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return attempts.filter((a) => {
      if (filterExam && a.exam_id !== filterExam) return false
      if (!q) return true
      const exam = examMap[a.exam_id]
      const haystack = [
        a.student_first_name,
        a.student_last_name,
        a.student_id_number,
        a.department,
        a.section,
        exam?.title,
        exam?.code,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [attempts, filterExam, search, examMap])

  const pagination = usePagination(filtered)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNavbar title="Attempts" />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attempts</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Student submissions across all exams you can manage
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {filtered.length} result{filtered.length === 1 ? '' : 's'}
            </span>
            <button
              onClick={() => setShowExport(true)}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Student name, ID, department, section, exam..."
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by Exam
            </label>
            <select
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All exams</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg bg-white py-12 text-center shadow dark:bg-gray-800">
            <ClipboardList className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">No attempts found</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {pagination.paged.map((a) => {
                const exam = examMap[a.exam_id]
                return (
                  <button
                    key={a.id}
                    onClick={() => setDetail(a)}
                    className="flex w-full items-center gap-4 rounded-lg bg-white p-4 text-left shadow hover:ring-2 hover:ring-indigo-500 dark:bg-gray-800"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">
                        {exam?.title || 'Unknown exam'}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-gray-500">
                        <UserIcon className="h-3 w-3" />
                        {a.student_first_name} {a.student_last_name} · {a.student_id_number}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>{exam?.code}</span>
                        {a.department && <span>{a.department}</span>}
                        {a.section && <span>Sec {a.section}</span>}
                        <span>
                          Score: {a.total_score} ({a.objective_score}+{a.ai_score})
                        </span>
                      </div>
                    </div>
                    <AttemptStatusBadge status={a.status} />
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                )
              })}
            </div>

            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}
      </main>

      {detail && (
        <AttemptDetail
          attempt={detail}
          exam={examMap[detail.exam_id]}
          onClose={() => setDetail(null)}
          onSaved={handleSaved}
        />
      )}

      {showExport && (
        <ExportModal
          attempts={filtered}
          examMap={examMap}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
