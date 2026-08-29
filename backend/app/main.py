from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect

from app.core.config import settings
from app.core.database import Base, engine
from app.models import Exam
from app.routers import auth, attempts, exams, health, invitations, schools
from app.services.grading_queue import start_grading_worker, stop_grading_worker
from app.services.processing_queue import start_worker, stop_worker


def _ensure_schema() -> None:
    """Dev convenience: drop stale tables when a column was renamed/added.

    `create_all` never alters existing tables, so during MVP development an old
    SQLite file would keep the previous schema. Drop a table when it is missing a
    column introduced after it was first created, then recreate everything.
    """
    inspector = inspect(engine)
    expected_columns = {
        "exams": {"document_content"},
        "exam_attempts": {"student_id"},
        "users": {"role"},
    }
    for table, required in expected_columns.items():
        if inspector.has_table(table):
            columns = {col["name"] for col in inspector.get_columns(table)}
            if not required.issubset(columns):
                Base.metadata.tables[table].drop(engine)
    Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (dev convenience; use Alembic in prod)
    _ensure_schema()
    start_worker()
    start_grading_worker()
    try:
        yield
    finally:
        stop_worker()
        stop_grading_worker()


app = FastAPI(
    title="Smart Exam Taker API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_BASE_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(schools.router, prefix=settings.API_V1_PREFIX)
app.include_router(invitations.router, prefix=settings.API_V1_PREFIX)
app.include_router(exams.router, prefix=settings.API_V1_PREFIX)
app.include_router(attempts.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {"name": settings.PROJECT_NAME, "version": "0.1.0"}
