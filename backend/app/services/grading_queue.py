import json
import logging
import threading
from typing import Any

from app.core.config import settings
from app.core.database import SessionLocal
from app.services import grading

logger = logging.getLogger(__name__)

_QUEUE_KEY = "attempt:queue"
_PROCESSING_KEY = "attempt:processing"

_redis: Any | None = None
_worker_thread: threading.Thread | None = None
_worker_stop = threading.Event()


def _get_redis() -> Any:
    global _redis
    if _redis is None:
        import redis

        url = settings.REDIS_URL
        if url and "://" not in url:
            url = f"redis://{url}"
        _redis = redis.Redis.from_url(
            url,
            decode_responses=False,
            socket_connect_timeout=5,
        )
    return _redis


def enqueue_attempt_grading(attempt_id: str) -> None:
    if not settings.REDIS_URL:
        logger.warning(
            "REDIS_URL is not configured; grading attempt %s synchronously", attempt_id
        )
        grading.grade_attempt(attempt_id)
        return

    payload = json.dumps({"attempt_id": attempt_id}).encode("utf-8")
    _get_redis().rpush(_QUEUE_KEY, payload)


def _requeue_interrupted_jobs(r: Any) -> None:
    while r.rpoplpush(_PROCESSING_KEY, _QUEUE_KEY) is not None:
        pass


def _process_payload(payload: bytes) -> None:
    job = json.loads(payload)
    attempt_id = job["attempt_id"]
    db = SessionLocal()
    try:
        grading.grade_attempt(attempt_id, db)
    finally:
        db.close()


def _worker_loop() -> None:
    r = _get_redis()
    _requeue_interrupted_jobs(r)
    while not _worker_stop.is_set():
        try:
            item = r.brpoplpush(_QUEUE_KEY, _PROCESSING_KEY, timeout=1)
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Redis queue unavailable, retrying: %s", exc)
            _worker_stop.wait(5)
            continue
        if item is None:
            continue
        try:
            _process_payload(item)
        finally:
            r.lrem(_PROCESSING_KEY, 1, item)


def start_grading_worker() -> None:
    global _worker_thread
    if not settings.REDIS_URL:
        logger.warning("REDIS_URL is not configured; attempt grading runs synchronously")
        return
    if _worker_thread is not None and _worker_thread.is_alive():
        return
    _worker_stop.clear()
    _worker_thread = threading.Thread(
        target=_worker_loop, name="attempt-grading", daemon=True
    )
    _worker_thread.start()


def stop_grading_worker() -> None:
    _worker_stop.set()
