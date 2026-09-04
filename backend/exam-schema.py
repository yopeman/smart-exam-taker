from enum import Enum
from pydantic import BaseModel, field_validator
from typing import List, Optional, Union, Literal, Dict

# ==================== Enums ====================
class QuestionType(Enum):
    MCQ = "mcq"
    MATCHING = "matching"
    TRUE_FALSE = "true_false"
    BLANK_SPACE = "blank_space"
    SHORT_ANSWER = "short_answer"


# ==================== Question Models ====================

## 1. Multiple Choice
class MCQOption(BaseModel):
    letter: str
    option: str

class MCQQuestion(BaseModel):
    type: Literal[QuestionType.MCQ] = QuestionType.MCQ
    question: str
    options: List[MCQOption]          # at least 2 options
    correct_answer: str

    @field_validator('correct_answer')
    def validate_correct_answer(cls, v, info):
        # Extract the letters from the options
        allowed_letters = [opt.letter for opt in info.data.get('options', [])]
        if v not in allowed_letters:
            raise ValueError(f'correct_answer "{v}" must match one of the option letters: {allowed_letters}')
        return v


## 2. True / False
class TrueFalseQuestion(BaseModel):
    type: Literal[QuestionType.TRUE_FALSE] = QuestionType.TRUE_FALSE
    question: str
    correct_answer: bool              # True for "True", False for "False"


## 3. Matching (fixed)
class MatchingQuestion(BaseModel):
    type: Literal[QuestionType.MATCHING] = QuestionType.MATCHING
    left_items: List[str]             # e.g. ["A", "B", "C"]
    right_items: List[str]            # e.g. ["1", "2", "3"]
    correct_mapping: Dict[int, int]   # left_index -> right_index (0‑based)

    @field_validator('correct_mapping')
    def validate_correct_mapping(cls, v, info):
        left_items = info.data.get('left_items', [])
        right_items = info.data.get('right_items', [])

        # 1. Check that mapping covers all left items
        if set(v.keys()) != set(range(len(left_items))):
            raise ValueError(
                f'correct_mapping keys must cover all left items (0..{len(left_items)-1}). '
                f'Got keys: {sorted(v.keys())}'
            )

        # 2. Check that every mapped right index is valid
        for left_idx, right_idx in v.items():
            if right_idx < 0 or right_idx >= len(right_items):
                raise ValueError(
                    f'right index {right_idx} for left item {left_idx} is out of range. '
                    f'Valid range: 0..{len(right_items)-1}'
                )

        # 3. (Optional) Ensure uniqueness of right mappings – usually each right is used once
        if len(set(v.values())) != len(v.values()):
            raise ValueError('Each right item can be matched to at most one left item (unique mapping required).')

        return v



## 4. Fill‑in‑the‑blank (multiple blanks)
class BlankSpaceQuestion(BaseModel):
    type: Literal[QuestionType.BLANK_SPACE] = QuestionType.BLANK_SPACE
    question: str                     # use _____ or {blank} placeholders
    correct_answers: List[str]        # ordered list, one per blank


## 5. Short Answer
class ShortAnswerQuestion(BaseModel):
    type: Literal[QuestionType.SHORT_ANSWER] = QuestionType.SHORT_ANSWER
    question: str
    correct_answer: str               # expected exact or fuzzy match (AI will handle variants)


## 6. Unified Question container
class Question(BaseModel):
    id: str                           # unique identifier for this question
    point: float                      # max score (allows partial credit)
    question: Union[
        MCQQuestion,
        TrueFalseQuestion,
        MatchingQuestion,
        BlankSpaceQuestion,
        ShortAnswerQuestion
    ]


## 7. Grouping questions under a scenario (e.g., a reading passage)
class SubQuestions(BaseModel):
    scenario: Optional[str] = None    # context text, image URL, etc.
    questions: List[Question]


## 8. Full exam
class TotalQuestions(BaseModel):
    questions: List[SubQuestions]


# ==================== Student Attempt Models ====================

## Student's answer – type depends on question type
# - MCQ: str (selected option text or letter)
# - True/False: bool
# - Matching: Dict[int, int] (left_index -> right_index)
# - Blank Space: List[str] (answers in order)
# - Short Answer: str
StudentAnswer = Union[str, bool, Dict[int, int], List[str]]

class StudentAttempt(BaseModel):
    id: str                           # attempt ID (e.g., UUID)
    question_id: str                  # MUST match a Question.id from the exam
    attempt: StudentAnswer            # the raw answer given by the student


## Collection of attempts (typically one per question)
class StudentAttempts(BaseModel):
    attempts: List[StudentAttempt]


# ==================== Evaluation Models ====================
class Correctness(Enum):
    CORRECT = 'correct'
    PARTIAL = 'partial'
    INCORRECT = 'incorrect'

## Result of grading a single attempt
class AttemptEvaluation(BaseModel):
    student_attempt: StudentAttempt
    score: float                         # points earned (could be partial)
    correctness: Correctness
    feedback: Optional[str] = None       # e.g., "Close, but missing 'Paris'"


## Collection of evaluations
class AttemptEvaluations(BaseModel):
    evaluations: List[AttemptEvaluation]
