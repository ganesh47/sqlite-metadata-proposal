from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from metadata_cli.models import MigrationJobRecord

DEFAULT_DB_PATH = Path.home() / ".metadata-cli" / "jobs.sqlite"
JOB_STATUSES = {"queued", "running", "succeeded", "failed"}


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

    def queue_job(
        self,
        *,
        job_id: str,
        source: str,
        image_digest: str | None = None,
        logs_url: str | None = None,
    ) -> MigrationJobRecord:
        record = MigrationJobRecord(
            job_id=job_id,
            source=source,
            status="queued",
            started_at=datetime.now(timezone.utc),
            metrics={},
            image_digest=image_digest,
            logs_url=logs_url,
        )
        self._conn.execute(
            """
            INSERT OR REPLACE INTO migration_jobs (
                job_id, source, status, started_at, metrics, image_digest, logs_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record.job_id,
                record.source,
                record.status,
                record.started_at.isoformat(),
                json.dumps(record.metrics),
                record.image_digest,
                record.logs_url,
            ),
        )
        self._conn.commit()
        return record

    def start_job(
        self,
        *,
        job_id: str,
        source: str,
        image_digest: str | None = None,
        logs_url: str | None = None,
    ) -> MigrationJobRecord:
        existing = self._get_optional_row(job_id)
        if existing:
            started_at = datetime.fromisoformat(existing["started_at"])
        else:
            started_at = datetime.now(timezone.utc)

        record = MigrationJobRecord(
            job_id=job_id,
            source=source,
            status="running",
            started_at=started_at,
            metrics=json.loads(existing["metrics"]) if existing and existing["metrics"] else {},
            image_digest=image_digest or (existing["image_digest"] if existing else None),
            logs_url=logs_url or (existing["logs_url"] if existing else None),
        )

        self._conn.execute(
            """
            INSERT INTO migration_jobs (job_id, source, status, started_at, metrics, image_digest, logs_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(job_id) DO UPDATE SET
              status=excluded.status,
              source=excluded.source,
              metrics=excluded.metrics,
              image_digest=COALESCE(excluded.image_digest, migration_jobs.image_digest),
              logs_url=COALESCE(excluded.logs_url, migration_jobs.logs_url)
            """,
            (
                record.job_id,
                record.source,
                record.status,
                record.started_at.isoformat(),
                json.dumps(record.metrics),
                record.image_digest,
                record.logs_url,
            ),
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
        if status not in JOB_STATUSES:
            raise ValueError(f"Unsupported status {status}")

        now = datetime.now(timezone.utc)
        self._conn.execute(
            """
            UPDATE migration_jobs
               SET status = ?,
                   completed_at = ?,
                   metrics = ?,
                   logs_url = COALESCE(?, logs_url)
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

    def _get_optional_row(self, job_id: str) -> sqlite3.Row | None:
        return self._conn.execute(
            "SELECT * FROM migration_jobs WHERE job_id = ?", (job_id,)
        ).fetchone()

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
