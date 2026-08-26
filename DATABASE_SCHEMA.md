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