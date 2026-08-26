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

# Database Schema:

## Users

- id
- name
- email
- password
- role: admin, instructor
- is verified
- created at
- updated at
- deleted at

## School

- id
- owner id
- name
- location
- logo url
- primary color
- secondary color
- created at
- updated at
- deleted at

## Instructor Invitation

- id
- school id
- instructor email
- max exams
- invited at
- accepted at
- rejected at
- expired at
- canceled at
- status: pending, accepted, rejected, canceled, expired
- created at
- updated at
- deleted at

## Exam

- id
- school id
- instructor id
- title
- description
- department
- year of study
- semester
- section
- document url
- questions {JSON}
- duration minutes
- started by
- scheduled at
- started at
- completed at
- cancelled at
- status: draft, scheduled, started, completed, cancelled
- created at
- updated at
- deleted at

## Exam Attempts

- id
- exam id
- student first name
- student last name
- student id number
- student face url
- face captured at
- department
- year of study
- semester
- section
- answers {JSON}
- grading details {JSON}
- objective score
- ai score
- total score
- started at
- submitted at
- graded at
- status: in progress, submitted, graded
- created at
- updated at
- deleted at

## Subscription Plans

- id
- name
- yearly price
- max students
- price per student
- max instructors
- price per instructor
- max exams
- price per exam
- max ai question conversions per exam
- price per question conversion
- max essays per exam
- price per essay
- max storage per file
- price per mb
- features {JSON}
- type: plan limit based, usage based
- status: draft, active, inactive
- created by
- created at
- updated at
- deleted at

## School Subscriptions

- id
- school id
- plan id
- status: pending, active, inactive, suspended, expired
- started at
- expires at
- payment provider
- payment receipt url
- payment status: pending, paid, cancelled, failed
- created at
- updated at
- deleted at

## School Subscription Details

- id
- school subscription id
- paid amount
- max students
- max instructors
- max exams
- max question conversion per exam
- max essays per exam
- max storage per file
- features {JSON}
- created at
- updated at
- deleted at

## School Subscription Usages

- id
- school subscription id
- students count
- instructors count
- ai question conversions count
- ai gradings count
- exams count
- essays count
- storage used mb
- pdf reports count
- csv report count
- xls report count
- created at
- updated at
- deleted at

## AI Usages

- id
- school id
- subscription id
- school subscription id
- exam id
- attempt id
- operation: question conversion, essay grading
- model
- input tokens
- output tokens
- estimated cost
- created at
- updated at
- deleted at