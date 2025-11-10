from __future__ import annotations

import json
from pathlib import Path

import pytest

from metadata_cli.config import CliSettings
from metadata_cli.db.migrations import MigrationJobStore


@pytest.fixture()
def sample_dataset(tmp_path: Path) -> Path:
    """Create a representative nodes/edges payload."""
    payload = {
        "nodes": [
            {"id": "node-1", "type": "workspace", "properties": {"name": "alpha"}},
            {"id": "node-2", "type": "workspace", "properties": {"name": "beta"}},
        ],
        "edges": [
            {
                "id": "edge-1",
                "sourceId": "node-1",
                "targetId": "node-2",
                "type": "link",
                "properties": {"reason": "demo"},
            }
        ],
        "metadata": {"source": "unit-tests"},
    }
    dataset_path = tmp_path / "dataset.json"
    dataset_path.write_text(json.dumps(payload), encoding="utf-8")
    return dataset_path


@pytest.fixture()
def cli_settings() -> CliSettings:
    return CliSettings(
        org_id="demo-org",
        api_url="https://mock.local",
        api_token="test-token",
        batch_size=2,
        source="unit-tests",
    )


@pytest.fixture()
def job_store(tmp_path: Path) -> MigrationJobStore:
    return MigrationJobStore(tmp_path / "jobs.sqlite")
