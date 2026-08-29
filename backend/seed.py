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
PROCESSING = "processing"
DRAFT = "draft"
SUBMITTED = "submitted"
SCHEDULED = "scheduled"
STARTED = "started"
COMPLETED = "completed"

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


def _now() -> datetime:
    return datetime.now(timezone.utc)


db: SessionLocal = None  # type: ignore


def seed_users() -> dict[str, User]:
    users: dict[str, User] = {}
    specs = [
        ("admin@yope.ai", "Site Admin", UserRole.admin, True),
        ("instructor@yope.ai", "Jane Instructor", UserRole.instructor, True),
        ("instructor1@yope.ai", "Ian Instructor", UserRole.instructor, True),
        ("instructor2@yope.ai", "Iris Instructor", UserRole.instructor, True),
        ("student@yope.ai", "Sam Student", UserRole.student, True),
    ]
    for email, name, role, verified in specs:
        user = User(
            name=name,
            email=email,
            password=hash_password(PASSWORD),
            role=role,
            is_verified=verified,
        )
        db.add(user)
        db.flush()
        users[email] = user
    db.commit()
    return users


def seed_schools(users: dict[str, User]) -> list[School]:
    schools: list[School] = []
    for i in range(10):
        school = School(
            owner_id=users["admin@yope.ai"].id,
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


def seed_exams(schools: list[School], users: dict[str, User]) -> list[Exam]:
    exams: list[Exam] = []
    for i in range(10):
        status = random.choice(list(ExamStatus))
        scheduled_at = _now() + timedelta(days=random.randint(1, 30))
        exam = Exam(
            school_id=schools[i].id,
            instructor_id=users["instructor@yope.ai"].id,
            code=f"EXAM{i + 1:04d}",
            title=f"{SUBJECTS[i]} Midterm",
            description=f"Midterm examination for {SUBJECTS[i]}.",
            department=random.choice(DEPARTMENTS),
            year_of_study=random.randint(1, 4),
            semester=random.choice(SEMESTERS),
            section=random.choice(SECTIONS),
            document_content=f"Sample document content for {SUBJECTS[i]}.",
            questions=[
                {
                    "id": 1,
                    "type": "multiple_choice",
                    "prompt": "What is 2 + 2?",
                    "options": ["3", "4", "5"],
                    "answer": "4",
                    "points": 5,
                },
                {
                    "id": 2,
                    "type": "essay",
                    "prompt": "Explain the topic briefly.",
                    "answer": None,
                    "points": 10,
                },
            ],
            duration_minutes=random.choice([30, 45, 60, 90]),
            max_students=random.randint(20, 100),
            max_reserved_students=random.randint(0, 10),
            status=status,
            scheduled_at=scheduled_at if status in (ExamStatus.scheduled, ExamStatus.started) else None,
            started_at=scheduled_at if status == ExamStatus.started else None,
            completed_at=_now() if status == ExamStatus.completed else None,
        )
        db.add(exam)
        db.flush()
        exams.append(exam)
    db.commit()
    return exams


def seed_attempts(exams: list[Exam], users: dict[str, User]) -> list[ExamAttempt]:
    attempts: list[ExamAttempt] = []
    for i in range(10):
        exam = exams[i]
        status = random.choice(list(AttemptStatus))
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        attempt = ExamAttempt(
            exam_id=exam.id,
            student_id=users["student@yope.ai"].id,
            student_first_name=first,
            student_last_name=last,
            student_id_number=f"STU{i + 1:06d}",
            student_face_url=f"https://cdn.example.com/faces/{i + 1}.png",
            face_captured_at=_now(),
            department=exam.department,
            year_of_study=exam.year_of_study,
            semester=exam.semester,
            section=exam.section,
            answers={"1": "4", "2": "Brief explanation text."},
            grading_details=[],
            objective_score=random.uniform(0, 5),
            ai_score=random.uniform(0, 10),
            total_score=random.uniform(0, 15),
            submitted_at=_now() if status in (AttemptStatus.submitted, AttemptStatus.graded) else None,
            graded_at=_now() if status == AttemptStatus.graded else None,
            status=status,
        )
        db.add(attempt)
        db.flush()
        attempts.append(attempt)
    db.commit()
    return attempts


def seed_invitations(
    schools: list[School], users: dict[str, User]
) -> list[InstructorInvitation]:
    invitations: list[InstructorInvitation] = []
    instructor_emails = ["instructor1@yope.ai", "instructor2@yope.ai"]
    for i, school in enumerate(schools):
        email = instructor_emails[i % len(instructor_emails)]
        status = (
            InvitationStatus.accepted
            if i % 3 != 0
            else InvitationStatus.pending
        )
        invitation = InstructorInvitation(
            school_id=school.id,
            instructor_email=email,
            max_exams=random.randint(1, 5),
            status=status,
            accepted_at=_now() if status == InvitationStatus.accepted else None,
            rejected_at=_now() if status == InvitationStatus.rejected else None,
            canceled_at=_now() if status == InvitationStatus.canceled else None,
        )
        db.add(invitation)
        db.flush()
        invitations.append(invitation)
    db.commit()
    return invitations


if __name__ == "__main__":
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    import sys as _sys

    _sys.modules[__name__].db = db
    try:
        print("Seeding users...")
        users = seed_users()
        print("Seeding schools...")
        schools = seed_schools(users)
        print("Seeding exams...")
        exams = seed_exams(schools, users)
        print("Seeding attempts...")
        attempts = seed_attempts(exams, users)
        print("Seeding instructor invitations...")
        invitations = seed_invitations(schools, users)
        print(
            f"Done. Created {len(users)} users, {len(schools)} schools, "
            f"{len(exams)} exams, {len(attempts)} attempts, "
            f"{len(invitations)} invitations."
        )
    finally:
        db.close()
