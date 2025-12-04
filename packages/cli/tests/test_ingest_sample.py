from __future__ import annotations

import json
from pathlib import Path

import httpx
import pytest

from metadata_cli.errors import DatasetValidationError, IngestionError
from metadata_cli.services.ingest import IngestionRunner


def _make_client(handler) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(handler), base_url="https://mock.local")


def test_ingest_success_posts_nodes_and_edges(sample_dataset, cli_settings, job_store):
    """Happy path: nodes + edges shipped in two batches with job metrics captured."""
    captured: list[tuple[str, dict]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content.decode("utf-8"))
        captured.append((request.url.path, payload))
        return httpx.Response(202, json={"accepted": len(payload.get("items", []))})

    runner = IngestionRunner(
        settings=cli_settings,
        job_store=job_store,
        http_client=_make_client(handler),
    )

    job = runner.run(sample_dataset)

    assert job.status == "succeeded"
    assert [path for path, _ in captured] == [
        "/orgs/demo-org/nodes",
        "/orgs/demo-org/edges",
    ]
    assert captured[0][1]["items"][0]["id"] == "node-1"
    metrics = job_store.list_jobs()[0].metrics
    assert metrics["nodesAccepted"] == 2
    assert metrics["edgesAccepted"] == 1
    assert metrics["batches"] == 2


def test_invalid_dataset_aborts_before_job_start(cli_settings, job_store, tmp_path: Path):
    invalid_payload = {"nodes": [{"id": "node-1", "type": "workspace"}]}  # missing properties
    dataset_path = tmp_path / "bad.json"
    dataset_path.write_text(json.dumps(invalid_payload), encoding="utf-8")

    runner = IngestionRunner(
        settings=cli_settings,
        job_store=job_store,
        http_client=_make_client(lambda _: httpx.Response(500)),
    )

    with pytest.raises(DatasetValidationError):
        runner.run(dataset_path)

    assert job_store.list_jobs() == []


def test_api_failure_marks_job_failed(sample_dataset, cli_settings, job_store):
    def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content.decode("utf-8"))
        if request.url.path.endswith("/edges"):
            return httpx.Response(500, json={"error": "boom"})
        return httpx.Response(202, json={"accepted": len(payload.get("items", []))})

    runner = IngestionRunner(
        settings=cli_settings,
        job_store=job_store,
        http_client=_make_client(handler),
    )

    with pytest.raises(IngestionError):
        runner.run(sample_dataset)

    stored_job = job_store.list_jobs()[0]
    assert stored_job.status == "failed"
    assert stored_job.metrics["nodesAccepted"] == 2


def test_ndjson_ingest_merges_records(sample_ndjson, cli_settings, job_store):
    captured: list[tuple[str, dict]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content.decode("utf-8"))
        captured.append((request.url.path, payload))
        return httpx.Response(202, json={"accepted": len(payload.get("items", []))})

    runner = IngestionRunner(
        settings=CliSettings.from_options(
            org=cli_settings.org_id,
            api_url=cli_settings.api_url,
            api_token=cli_settings.api_token,
            batch_size=cli_settings.batch_size,
            source=cli_settings.source,
            job_store=cli_settings.job_store_path,
            dataset_format="ndjson",
        ),
        job_store=job_store,
        http_client=_make_client(handler),
    )

    job = runner.run(sample_ndjson)

    assert job.status == "succeeded"
    assert [path for path, _ in captured] == [
        "/orgs/demo-org/nodes",
        "/orgs/demo-org/edges",
    ]
    assert captured[0][1]["items"][0]["id"] == "node-1"
    metrics = job_store.list_jobs()[0].metrics
    assert metrics["nodesAccepted"] == 1
    assert metrics["edgesAccepted"] == 1


def test_csv_ingest_parses_nodes_and_edges(sample_csv, cli_settings, job_store):
    captured: list[tuple[str, dict]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content.decode("utf-8"))
        captured.append((request.url.path, payload))
        return httpx.Response(202, json={"accepted": len(payload.get("items", []))})

    runner = IngestionRunner(
        settings=CliSettings.from_options(
            org=cli_settings.org_id,
            api_url=cli_settings.api_url,
            api_token=cli_settings.api_token,
            batch_size=cli_settings.batch_size,
            source=cli_settings.source,
            job_store=cli_settings.job_store_path,
            dataset_format="csv",
        ),
        job_store=job_store,
        http_client=_make_client(handler),
    )

    job = runner.run(sample_csv)

    assert job.status == "succeeded"
    assert [path for path, _ in captured] == [
        "/orgs/demo-org/nodes",
        "/orgs/demo-org/edges",
    ]
    metrics = job_store.list_jobs()[0].metrics
    assert metrics["nodesAccepted"] == 2
    assert metrics["edgesAccepted"] == 1
*** End Patch Mistake/Error ***!
