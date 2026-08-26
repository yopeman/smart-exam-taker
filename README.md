# Smart Exam Taker — Project Overview & Tech Stack

**Smart Exam Taker** is an **AI-powered mobile examination management system** designed for universities and colleges. Its purpose is to replace much of the traditional paper-based examination process with a secure digital system that supports **exam creation, delivery, AI question generation, automatic grading, student identification, scheduling, and reporting**. 

## 1. The Problem

Universities and colleges commonly face:

* High costs from printing paper exams
* Time-consuming exam preparation
* Manual grading workload
* Human errors in scoring
* Cheating and exam-integrity concerns
* Slow result processing and reporting

Smart Exam Taker addresses these problems by digitizing the examination workflow and automating important parts of it. 

---

# 2. How the System Works

The overall workflow is:

```text
Instructor
    │
    ▼
Create Exam / Upload Document
    │
    ▼
AI Document Processing
    │
    ▼
Structured Questions
    │
    ▼
Schedule or Start Exam
    │
    ▼
Student Enters Exam
    │
    ├── Student Information
    ├── Student ID
    └── Face Capture
    │
    ▼
Take Exam
    │
    ├── Timer
    ├── Randomized Questions
    └── Auto-save Answers
    │
    ▼
Submit Exam
    │
    ▼
Automatic Grading
    │
    ├── Objective Questions → Automatic
    └── Short Answer/Essay → AI
    │
    ▼
Calculate Result
    │
    ▼
Generate Reports
    │
    ├── PDF
    ├── Excel
    └── CSV
```

The documented system specifically includes AI document conversion, randomized exams, timed exams, autosave, automatic grading, reporting, and CSV/Excel export. 

---

# 3. Main Users

The project has three main user types:

### Admin

Manages the institution and instructors.

### Instructor

Creates and manages exams, uploads materials, schedules exams, and reviews results.

### Student

Uses the mobile application to enter and complete exams.

The original documentation identifies students, instructors, and institution administrators as the main personas. 

---


### Tech STack

**Frontend:** React Native + React/Next.js
**Backend:** FastAPI
**Database:** SQLite3
**ORM:** SQLAlchemy
**Validation:** Pydantic
**Cache/queue:** Redis
**Background jobs:** Celery/RQ
**AI:** Groq LLM API + LangChain
**Storage:** Local disk storage
**Reports:** PDF + Excel + CSV

This stack fits the project's core goal: **a multi-institution SaaS platform that digitizes exams and uses AI to automate question conversion and grading**, while keeping the student exam experience mobile-first. 


# Features

1. Student mobile application
2. Web dashboard for administrators and instructors
3. User authentication and role-based access
4. University/college organizational structure
5. Student information capture:
    - First name
    - Last name
    - Student ID
    - Section
    - Department
    - Year of study
    - Face/photo
6. Face capture before starting an exam
7. Exam creation and management
8. Multiple question types:
    - MCQ
    - True/False
    - Matching
    - Fill-in-the-blank
    - Essay (or simply Short answer)
9. AI-powered document import and question conversion
10. Question and answer randomization
11. Exam scheduling
12. Instructor-controlled exam triggering
13. Exam timer and automatic submission
14. Answer auto save
15. Automatic grading for objective questions
16. AI-assisted automatic grading for short answers and essays
17. Automatic score calculation
18. Student result reporting
19. CSV and Excel export
20. PDF report export with detailed student information and face/photo
21. Custom institution branding and themes
    - Institution logo
    - Institution name
    - Brand colors
    - Exam/report appearance
    - Custom theme
