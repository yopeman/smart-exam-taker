import { z } from 'zod';

// ==================== Enums (as const objects) ====================
export const QuestionType = {
  MCQ: 'mcq',
  MATCHING: 'matching',
  TRUE_FALSE: 'true_false',
  BLANK_SPACE: 'blank_space',
  SHORT_ANSWER: 'short_answer',
} as const;

export const Correctness = {
  CORRECT: 'correct',
  PARTIAL: 'partial',
  INCORRECT: 'incorrect',
} as const;

// ==================== Question Schemas ====================

// 1. MCQ
export const MCQOptionSchema = z.object({
  letter: z.string(),
  option: z.string(),
});

export const MCQQuestionSchema = z
  .object({
    type: z.literal(QuestionType.MCQ),
    question: z.string(),
    options: z.array(MCQOptionSchema).min(2),
    correct_answer: z.string(),
  })
  .superRefine((data, ctx) => {
    const allowedLetters = data.options.map(opt => opt.letter);
    if (!allowedLetters.includes(data.correct_answer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `correct_answer "${data.correct_answer}" must match one of the option letters: ${allowedLetters.join(', ')}`,
        path: ['correct_answer'],
      });
    }
  });

// 2. True / False
export const TrueFalseQuestionSchema = z.object({
  type: z.literal(QuestionType.TRUE_FALSE),
  question: z.string(),
  correct_answer: z.boolean(),
});

// 3. Matching (with validations)
export const MatchingQuestionSchema = z
  .object({
    type: z.literal(QuestionType.MATCHING),
    left_items: z.array(z.string()),
    right_items: z.array(z.string()),
    correct_mapping: z.record(z.number(), z.number()),
  })
  .superRefine((data, ctx) => {
    const { left_items, right_items, correct_mapping } = data;
    const leftIndices = Object.keys(correct_mapping).map(Number);

    // 1. Coverage: keys must be exactly 0..len(left_items)-1
    const expectedKeys = Array.from({ length: left_items.length }, (_, i) => i);
    const missing = expectedKeys.filter(k => !leftIndices.includes(k));
    const extra = leftIndices.filter(k => !expectedKeys.includes(k));
    if (missing.length || extra.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `correct_mapping keys must cover exactly 0..${left_items.length - 1}. ` +
                 `Missing: ${missing.join(', ')}, Extra: ${extra.join(', ')}`,
        path: ['correct_mapping'],
      });
    }

    // 2. Right index bounds
    for (const [leftIdx, rightIdx] of Object.entries(correct_mapping)) {
      if (rightIdx < 0 || rightIdx >= right_items.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `right index ${rightIdx} for left item ${leftIdx} is out of range (0..${right_items.length - 1})`,
          path: ['correct_mapping', leftIdx],
        });
      }
    }

    // 3. Uniqueness of right mappings
    const rightValues = Object.values(correct_mapping);
    if (new Set(rightValues).size !== rightValues.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Each right item can be matched at most once (unique mapping required).',
        path: ['correct_mapping'],
      });
    }
  });

// 4. Blank Space
export const BlankSpaceQuestionSchema = z.object({
  type: z.literal(QuestionType.BLANK_SPACE),
  question: z.string(),
  correct_answers: z.array(z.string()),
});

// 5. Short Answer
export const ShortAnswerQuestionSchema = z.object({
  type: z.literal(QuestionType.SHORT_ANSWER),
  question: z.string(),
  correct_answer: z.string(),
});

// 6. Union of all question types (discriminated by 'type')
export const QuestionSchema = z.discriminatedUnion('type', [
  MCQQuestionSchema,
  TrueFalseQuestionSchema,
  MatchingQuestionSchema,
  BlankSpaceQuestionSchema,
  ShortAnswerQuestionSchema,
]);

// 7. Unified Question container
export const QuestionContainerSchema = z.object({
  id: z.string(),
  point: z.number().min(0),
  question: QuestionSchema,
});

// 8. Group under a scenario
export const SubQuestionsSchema = z.object({
  scenario: z.string().optional(),
  questions: z.array(QuestionContainerSchema),
});

// 9. Full exam
export const TotalQuestionsSchema = z.object({
  questions: z.array(SubQuestionsSchema),
});

// ==================== Student Attempt Schemas ====================

// StudentAnswer union
export const StudentAnswerSchema = z.union([
  z.string(),
  z.boolean(),
  z.record(z.number(), z.number()),
  z.array(z.string()),
]);

export const StudentAttemptSchema = z.object({
  id: z.string(),
  question_id: z.string(),
  attempt: StudentAnswerSchema,
});

export const StudentAttemptsSchema = z.object({
  attempts: z.array(StudentAttemptSchema),
});

// ==================== Evaluation Schemas ====================

export const AttemptEvaluationSchema = z.object({
  student_attempt: StudentAttemptSchema,
  score: z.number().min(0),
  correctness: z.enum([Correctness.CORRECT, Correctness.PARTIAL, Correctness.INCORRECT]),
  feedback: z.string().optional(),
});

export const AttemptEvaluationsSchema = z.object({
  evaluations: z.array(AttemptEvaluationSchema),
});

// ==================== Type Inference (optional) ====================
export type MCQOption = z.infer<typeof MCQOptionSchema>;
export type MCQQuestion = z.infer<typeof MCQQuestionSchema>;
export type TrueFalseQuestion = z.infer<typeof TrueFalseQuestionSchema>;
export type MatchingQuestion = z.infer<typeof MatchingQuestionSchema>;
export type BlankSpaceQuestion = z.infer<typeof BlankSpaceQuestionSchema>;
export type ShortAnswerQuestion = z.infer<typeof ShortAnswerQuestionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionContainer = z.infer<typeof QuestionContainerSchema>;
export type SubQuestions = z.infer<typeof SubQuestionsSchema>;
export type TotalQuestions = z.infer<typeof TotalQuestionsSchema>;
export type StudentAnswer = z.infer<typeof StudentAnswerSchema>;
export type StudentAttempt = z.infer<typeof StudentAttemptSchema>;
export type StudentAttempts = z.infer<typeof StudentAttemptsSchema>;
export type AttemptEvaluation = z.infer<typeof AttemptEvaluationSchema>;
export type AttemptEvaluations = z.infer<typeof AttemptEvaluationsSchema>;
