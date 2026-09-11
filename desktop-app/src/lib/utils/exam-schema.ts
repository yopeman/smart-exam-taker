export const QuestionType = {
  MCQ: 'mcq',
  MATCHING: 'matching',
  TRUE_FALSE: 'true_false',
  BLANK_SPACE: 'blank_space',
  SHORT_ANSWER: 'short_answer',
} as const;

export interface MCQOption {
  letter: string;
  option: string;
}

export interface NormalizedQuestion {
  id: string;
  point: number;
  type: string;
  question: string;
  scenario?: string;
  scenario_image_ids?: string[];
  options?: MCQOption[];
  left_items?: string[];
  right_items?: string[];
  correct_answers?: string[];
  blank_count?: number;
}

export interface NormalizedGroup {
  scenario?: string;
  scenario_image_ids?: string[];
  questions: NormalizedQuestion[];
}

export function normalizeQuestion(container: any): NormalizedQuestion | null {
  if (!container) return null;
  const item = container.question || container;
  const type = item.type;
  const base: NormalizedQuestion = {
    id: container.id,
    point: container.point ?? item.point ?? 1,
    type,
    question: item.question || item.prompt || '',
    scenario: container.scenario ?? undefined,
  };
  if (type === QuestionType.MCQ && Array.isArray(item.options)) {
    base.options = item.options.map((opt: any, i: number) =>
      typeof opt === 'string'
        ? { letter: String.fromCharCode(65 + i), option: opt }
        : { letter: opt.letter ?? String.fromCharCode(65 + i), option: opt.option ?? opt.text }
    );
  }
  if (type === QuestionType.MATCHING) {
    base.left_items = item.left_items || [];
    base.right_items = item.right_items || [];
  }
  if (type === QuestionType.BLANK_SPACE) {
    base.correct_answers = item.correct_answers || [];
    base.blank_count = item.blank_count ?? item.correct_answers?.length ?? 1;
  }
  return base;
}

function shuffle<T>(arr: T[]): T[] {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function flattenExamQuestions(payload: any): NormalizedGroup[] {
  if (!payload) return [];
  const raw: any[] = Array.isArray(payload) ? payload : payload.questions || [];
  const groups = shuffle<any>(raw);
  const out: NormalizedGroup[] = [];
  for (const group of groups) {
    const rawQuestions: any[] = group.questions || [];
    const questions = shuffle<any>(rawQuestions)
      .map((q: any) => normalizeQuestion(q))
      .filter((q: NormalizedQuestion | null): q is NormalizedQuestion => q !== null);
    if (questions.length > 0) {
      out.push({
        scenario: group.scenario,
        scenario_image_ids: group.scenario_image_ids,
        questions,
      });
    }
  }
  return out;
}

export function buildAttemptsPayload(answers: Record<string, any>) {
  return {
    attempts: Object.entries(answers || {}).map(([question_id, attempt]) => ({
      id: `attempt-${question_id}`,
      question_id,
      attempt,
    })),
  };
}