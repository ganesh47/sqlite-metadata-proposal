from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Optional

from metadata_cli.models import MigrationJobRecord

DEFAULT_DB_PATH = Path.home() / ".metadata-cli" / "jobs.sqlite"


class MigrationJobStore:
    """Lightweight SQLite-backed store tracking ingestion job metadata."""

    def __init__(self, db_path: Optional[Path] = None):
        path = db_path or DEFAULT_DB_PATH
        if str(path) != ":memory:":
            path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(path))
        self._conn.row_factory = sqlite3.Row
        self._ensure_schema()

    def _ensure_schema(self) -> None:
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS migration_jobs (
                job_id TEXT PRIMARY KEY,
                source TEXT NOT NULL,
                status TEXT NOT NULL,
                started_at TEXT NOT NULL,
                completed_at TEXT,
                metrics TEXT,
                image_digest TEXT,
                logs_url TEXT
            )
            """
        )
        self._conn.commit()

    def start_job(self, *, job_id: str, source: str) -> MigrationJobRecord:
        now = datetime.now(timezone.utc)
        record = MigrationJobRecord(
            job_id=job_id,
            source=source,
            status="running",
            started_at=now,
        )
        self._conn.execute(
            """
            INSERT OR REPLACE INTO migration_jobs (
                job_id, source, status, started_at, metrics
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (record.job_id, record.source, record.status, record.started_at.isoformat(), json.dumps({})),
        )
        self._conn.commit()
        return record

    def complete_job(
        self,
        job_id: str,
        *,
        status: str,
        metrics: dict[str, Any],
        logs_url: str | None = None,
    ) -> MigrationJobRecord:
        now = datetime.now(timezone.utc)
        self._conn.execute(
            """
            UPDATE migration_jobs
               SET status = ?,
                   completed_at = ?,
                   metrics = ?,
                   logs_url = ?
             WHERE job_id = ?
            """,
            (status, now.isoformat(), json.dumps(metrics), logs_url, job_id),
        )
        self._conn.commit()
        row = self._fetch_row(job_id)
        return self._row_to_record(row)

    def list_jobs(self) -> list[MigrationJobRecord]:
        rows = self._conn.execute(
            "SELECT * FROM migration_jobs ORDER BY started_at DESC"
        ).fetchall()
        return [self._row_to_record(row) for row in rows]

    def _fetch_row(self, job_id: str) -> sqlite3.Row:
        row = self._conn.execute(
            "SELECT * FROM migration_jobs WHERE job_id = ?", (job_id,)
        ).fetchone()
        if row is None:
            raise KeyError(f"job {job_id} not found")
        return row

    def _row_to_record(self, row: sqlite3.Row) -> MigrationJobRecord:
        metrics = json.loads(row["metrics"]) if row["metrics"] else {}
        started_at = datetime.fromisoformat(row["started_at"])
        completed_at = (
            datetime.fromisoformat(row["completed_at"])
            if row["completed_at"]
            else None
        )
        return MigrationJobRecord(
            job_id=row["job_id"],
            source=row["source"],
            status=row["status"],
            started_at=started_at,
            completed_at=completed_at,
            metrics=metrics,
            image_digest=row["image_digest"],
            logs_url=row["logs_url"],
        )

    def close(self) -> None:
        self._conn.close()

    def __del__(self) -> None:
        try:
            self.close()
        except Exception:  # pragma: no cover
            pass
