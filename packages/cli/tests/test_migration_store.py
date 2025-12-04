from __future__ import annotations

from datetime import datetime, timezone

import pytest

from metadata_cli.db.migrations import MigrationJobStore


def test_queue_and_start_job_update_status(tmp_path):
    store = MigrationJobStore(tmp_path / "jobs.sqlite")

    queued = store.queue_job(job_id="job-1", source="cli", image_digest="sha256:123", logs_url="http://logs")
    assert queued.status == "queued"
    assert queued.image_digest == "sha256:123"
    assert queued.logs_url == "http://logs"

    started = store.start_job(job_id="job-1", source="cli")
    assert started.status == "running"
    assert started.started_at == queued.started_at
    assert started.image_digest == "sha256:123"

    store.close()


def test_complete_job_updates_metrics(tmp_path):
    store = MigrationJobStore(tmp_path / "jobs.sqlite")
    job = store.start_job(job_id="job-2", source="cli")

    completed = store.complete_job("job-2", status="succeeded", metrics={"nodesAccepted": 2})
    assert completed.status == "succeeded"
    assert completed.metrics["nodesAccepted"] == 2
    assert completed.completed_at is not None
    assert completed.completed_at.tzinfo == timezone.utc

    jobs = store.list_jobs()
    assert len(jobs) == 1
    assert jobs[0].job_id == job.job_id

    store.close()


def test_complete_job_rejects_unknown_status(tmp_path):
    store = MigrationJobStore(tmp_path / "jobs.sqlite")
    store.start_job(job_id="job-3", source="cli")

    with pytest.raises(ValueError):
        store.complete_job("job-3", status="unknown", metrics={})

    store.close()
