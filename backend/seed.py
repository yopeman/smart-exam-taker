import random
from datetime import datetime, timedelta, timezone

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models import (
    AttemptStatus,
    Exam,
    ExamAttempt,
    ExamStatus,
    InstructorInvitation,
    InvitationStatus,
    School,
    User,
    UserRole,
)

PASSWORD = "12345678"

FIRST_NAMES = [
    "Alice", "Bob", "Carol", "David", "Eve", "Frank", "Grace", "Henry",
    "Ivy", "Jack", "Karen", "Leo", "Mona", "Nate", "Olivia", "Paul",
]
LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Martinez", "Lopez", "Wilson", "Anderson", "Taylor", "Thomas",
]
DEPARTMENTS = [
    "Computer Science", "Mathematics", "Physics", "Chemistry", "Biology",
    "Engineering", "Economics", "Literature", "History", "Psychology",
]
SEMESTERS = ["Fall", "Spring", "Summer"]
SECTIONS = ["A", "B", "C", "D"]
SCHOOL_NAMES = [
    "Bright Future Academy", "Summit College", "Riverdale High",
    "Northstar University", "Pioneer Institute", "Crestview School",
    "Horizon Academy", "Liberty Tech", "Greenfield College", "Atlas University",
]
CITIES = [
    "New York, USA", "London, UK", "Berlin, Germany", "Tokyo, Japan",
    "Toronto, Canada", "Sydney, Australia", "Paris, France", "Dubai, UAE",
    "Singapore", "Cape Town, South Africa",
]
SUBJECTS = [
    "Data Structures", "Linear Algebra", "Quantum Mechanics", "Organic Chemistry",
    "Genetics", "Circuit Design", "Macroeconomics", "Modern Poetry",
    "World War II", "Cognitive Science",
]

INSTRUCTOR_EMAILS = ["instructor1@yope.ai", "instructor2@yope.ai"]
STUDENT_COUNT = 30
EXAMS_PER_SCHOOL = 2
ATTEMPTS_PER_EXAM = 4


def _now() -> datetime:
    return datetime.now(timezone.utc)


db: SessionLocal = None  # type: ignore


def seed_users() -> tuple[dict[str, User], list[User]]:
    users: dict[str, User] = {}

    staff_specs = [
        ("instructor@yope.ai", "Site Admin", UserRole.instructor),
        ("instructor1@yope.ai", "Ian Instructor", UserRole.instructor),
        ("instructor2@yope.ai", "Iris Instructor", UserRole.instructor),
    ]
    for email, name, role in staff_specs:
        user = User(
            name=name,
            email=email,
            password=hash_password(PASSWORD),
            role=role,
            is_verified=True,
        )
        db.add(user)
        db.flush()
        users[email] = user

    students: list[User] = []
    used_emails = set()
    for i in range(STUDENT_COUNT):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        email = f"student{i + 1}@yope.ai"
        while email in used_emails:
            i += STUDENT_COUNT
            email = f"student{i + 1}@yope.ai"
        used_emails.add(email)
        student = User(
            name=f"{first} {last}",
            email=email,
            password=hash_password(PASSWORD),
            role=UserRole.student,
            is_verified=True,
        )
        db.add(student)
        db.flush()
        users[email] = student
        students.append(student)

    db.commit()
    return users, students


def seed_schools(users: dict[str, User]) -> list[School]:
    schools: list[School] = []
    admin = users["instructor@yope.ai"]
    for i in range(len(SCHOOL_NAMES)):
        school = School(
            owner_id=admin.id,
            name=SCHOOL_NAMES[i],
            location=CITIES[i],
            logo_url=f"https://cdn.example.com/logos/{i + 1}.png",
            primary_color="#%06x" % random.randint(0, 0xFFFFFF),
            secondary_color="#%06x" % random.randint(0, 0xFFFFFF),
        )
        db.add(school)
        db.flush()
        schools.append(school)
    db.commit()
    return schools


def seed_invitations(
    schools: list[School], users: dict[str, User]
) -> dict[str, User]:
    instructors = [users[email] for email in INSTRUCTOR_EMAILS]
    school_instructor: dict[str, User] = {}
    for i, school in enumerate(schools):
        instructor = instructors[i % len(instructors)]
        school_instructor[school.id] = instructor
        invitation = InstructorInvitation(
            school_id=school.id,
            instructor_email=instructor.email,
            max_exams=random.randint(1, 5),
            status=InvitationStatus.accepted,
            accepted_at=_now(),
        )
        db.add(invitation)
        db.flush()
    db.commit()
    return school_instructor


def _build_questions(subject: str) -> list[dict]:
    return [
        {
            "type": "mcq",
            "prompt": "What is 2 + 2?",
            "options": [
                {"text": "3", "is_correct": False},
                {"text": "4", "is_correct": True},
                {"text": "5", "is_correct": False},
            ],
            "multiple_correct": False,
            "points": 5,
        },
        {
            "type": "essay",
            "prompt": f"Explain a core concept of {subject} briefly.",
            "points": 10,
        },
    ]


def seed_exams(
    schools: list[School], school_instructor: dict[str, User]
) -> list[Exam]:
    exams: list[Exam] = []
    for school in schools:
        instructor = school_instructor[school.id]
        for j in range(EXAMS_PER_SCHOOL):
            subject = random.choice(SUBJECTS)
            status = random.choice(list(ExamStatus))
            scheduled_at = _now() + timedelta(days=random.randint(1, 30))
            exam = Exam(
                school_id=school.id,
                instructor_id=instructor.id,
                code=f"EXAM{len(exams) + 1:04d}",
                title=f"{subject} {['Midterm', 'Final'][j % 2]}",
                description=f"{['Midterm', 'Final'][j % 2]} examination for {subject}.",
                department=random.choice(DEPARTMENTS),
                year_of_study=random.randint(1, 4),
                semester=random.choice(SEMESTERS),
                section=random.choice(SECTIONS),
                document_content=f"Sample document content for {subject}.",
                questions=_build_questions(subject),
                duration_minutes=random.choice([30, 45, 60, 90]),
                max_students=random.randint(20, 100),
                max_reserved_students=random.randint(0, 10),
                status=status,
                scheduled_at=(
                    scheduled_at
                    if status in (ExamStatus.scheduled, ExamStatus.started)
                    else None
                ),
                started_at=scheduled_at if status == ExamStatus.started else None,
                completed_at=_now() if status == ExamStatus.completed else None,
            )
            db.add(exam)
            db.flush()
            exams.append(exam)
    db.commit()
    return exams


def seed_attempts(exams: list[Exam], students: list[User]) -> list[ExamAttempt]:
    attempts: list[ExamAttempt] = []
    for exam in exams:
        exam_students = random.sample(students, min(ATTEMPTS_PER_EXAM, len(students)))
        for student in exam_students:
            status = random.choice(list(AttemptStatus))
            first, _, last = student.name.partition(" ")
            attempt = ExamAttempt(
                exam_id=exam.id,
                student_id=student.id,
                student_first_name=first,
                student_last_name=last,
                student_id_number=f"STU{student.id[-6:]}",
                student_face_url=f"https://cdn.example.com/faces/{student.id}.png",
                face_captured_at=_now(),
                department=exam.department,
                year_of_study=exam.year_of_study,
                semester=exam.semester,
                section=exam.section,
                answers={"1": "4", "2": "Brief explanation text."},
                grading_details=[
                    {
                        "question_id": 1,
                        "type": "multiple_choice",
                        "score": round(random.uniform(0, 5), 2),
                        "max_score": 5,
                    },
                    {
                        "question_id": 2,
                        "type": "essay",
                        "score": round(random.uniform(0, 10), 2),
                        "max_score": 10,
                    },
                ],
                objective_score=round(random.uniform(0, 5), 2),
                ai_score=round(random.uniform(0, 10), 2),
                total_score=round(random.uniform(0, 15), 2),
                submitted_at=(
                    _now()
                    if status in (AttemptStatus.submitted, AttemptStatus.graded)
                    else None
                ),
                graded_at=_now() if status == AttemptStatus.graded else None,
                status=status,
            )
            db.add(attempt)
            db.flush()
            attempts.append(attempt)
    db.commit()
    return attempts


if __name__ == "__main__":
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    import sys as _sys

    _sys.modules[__name__].db = db
    try:
        print("Seeding users and students...")
        users, students = seed_users()
        print("Seeding schools...")
        schools = seed_schools(users)
        print("Seeding instructor invitations...")
        school_instructor = seed_invitations(schools, users)
        print("Seeding exams...")
        exams = seed_exams(schools, school_instructor)
        print("Seeding attempts...")
        attempts = seed_attempts(exams, students)
        print(
            f"Done. Created {len(users)} users ({len(students)} students), "
            f"{len(schools)} schools, {len(exams)} exams, "
            f"{len(attempts)} attempts."
        )
    finally:
        db.close()
