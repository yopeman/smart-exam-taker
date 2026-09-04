from enum import Enum
from pydantic import BaseModel
from typing import List, Optional, Union, Literal

class QuestionType(Enum):
    mcq = "mcq"
    matching = "matching"
    true_false = "true_false"
    blank_space = "blank_space"
    short_answer = "short_answer"


###########| MCQ |######################
class MCQOption(BaseModel):
    option: str
    is_correct: bool

class MCQQuestion(BaseModel):
    type: Literal[QuestionType.mcq] = QuestionType.mcq
    question: str
    options: List[MCQOption]


##########| Matching |####################
class MatchPair(BaseModel):
    left: Optional[str] = None
    right: Optional[str] = None

class MatchingQuestion(BaseModel):
    type: Literal[QuestionType.matching] = QuestionType.matching
    pairs: List[MatchPair]


##########| Blank Space |##################
class BlankSpaceAnswer(BaseModel):
    answer: str

class BlankSpaceQuestion(BaseModel):
    type: Literal[QuestionType.blank_space] = QuestionType.blank_space
    question: str
    answers: List[BlankSpaceAnswer]


##########| Short Answer |###################
class ShortAnswerQuestion(BaseModel):
    type: Literal[QuestionType.short_answer] = QuestionType.short_answer
    question: str
    answer: str


##########| Total Questions |###################
class Question(BaseModel):
    id: str
    point: int
    question: Union[
        MCQQuestion,
        MatchingQuestion,
        BlankSpaceQuestion,
        ShortAnswerQuestion
    ]

class SubQuestions(BaseModel):
    scenario: Optional[str] = None
    questions: List[Question]

class TotalQuestions(BaseModel):
    questions: List[SubQuestions]


##########| Student Answers |###################
class Answer(BaseModel):
    answer: Union[str, List[str], bool]

class StudentAttempt(BaseModel):
    id: str
    scenario: str
    type: Literal[
        QuestionType.mcq,
        QuestionType.matching,
        QuestionType.true_false,
        QuestionType.blank_space,
        QuestionType.short_answer
    ]
    question: str
    attempt: Answer

class StudentAttempts(BaseModel):
    attempts: List[StudentAttempt]

##########| Student Answers |###################
class AttemptEvaluation(BaseModel):
    student_attempt: StudentAttempt
    answer: Answer
    score: int

class AttemptEvaluations(BaseModel):
    evaluations: List[AttemptEvaluation]
