from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from app.core.database import Base, engine
from app.routers import health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (dev convenience; use Alembic in prod)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Smart Exam Taker API",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(health.router)


@app.get("/")
def root():
    return {"name": settings.PROJECT_NAME, "version": "0.1.0"}
