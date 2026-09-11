// Frontend mirror of backend/exam-schema.ts
// Canonical question / attempt / grading shapes shared with the API.

export const QuestionType = {
  MCQ: 'mcq',
  MATCHING: 'matching',
  TRUE_FALSE: 'true_false',
  BLANK_SPACE: 'blank_space',
  SHORT_ANSWER: 'short_answer',
}

export const Correctness = {
  CORRECT: 'correct',
  PARTIAL: 'partial',
  INCORRECT: 'incorrect',
}

export const QUESTION_TYPES = [
  { value: QuestionType.MCQ, label: 'Multiple Choice' },
  { value: QuestionType.MATCHING, label: 'Matching' },
  { value: QuestionType.TRUE_FALSE, label: 'True / False' },
  { value: QuestionType.BLANK_SPACE, label: 'Fill in the Blank' },
  { value: QuestionType.SHORT_ANSWER, label: 'Short Answer' },
]

// Normalize a single question container from the API into { id, point, item }.
export function normalizeQuestion(container) {
  if (!container) return null
  const item = container.question || container
  let questionText = item.question || item.prompt || ''
  let type = item.type
  let extra = {}

  switch (type) {
    case QuestionType.MCQ:
      if (Array.isArray(item.options)) {
        const options = item.options.map((opt, i) =>
          typeof opt === 'string'
            ? { letter: String.fromCharCode(65 + i), option: opt }
            : { letter: opt.letter, option: opt.option ?? opt.text }
        )
        extra.options = options
      }
      break
    case QuestionType.MATCHING:
      extra.left_items = item.left_items || []
      extra.right_items = item.right_items || []
      break
    case QuestionType.TRUE_FALSE:
      break
    case QuestionType.BLANK_SPACE:
      extra.correct_answers = item.correct_answers || []
      break
    case QuestionType.SHORT_ANSWER:
      extra.correct_answer = item.correct_answer || ''
      break
    default:
      break
  }

  return {
    id: container.id,
    point: container.point ?? item.point ?? item.points ?? 1,
    type,
    question: questionText,
    ...extra,
  }
}

// Flatten a TotalQuestions payload into an ordered list of normalized questions.
export function flattenExamQuestions(payload) {
  if (!payload) return []
  const groups = Array.isArray(payload) ? payload : payload.questions || []
  const out = []
  for (const group of groups) {
    for (const q of group.questions || []) {
      out.push({ scenario: group.scenario || null, ...normalizeQuestion(q) })
    }
  }
  return out
}

// Build the answers payload in the canonical StudentAttempts shape.
export function buildAttemptsPayload(answers) {
  return {
    attempts: Object.entries(answers || {}).map(([question_id, attempt]) => ({
      id: `attempt-${question_id}`,
      question_id,
      attempt,
    })),
  }
}