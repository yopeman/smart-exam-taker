# Database Schema:

## Users
- id
- name
- email
- password
- role: admin, instructor (default)
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
- code
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
