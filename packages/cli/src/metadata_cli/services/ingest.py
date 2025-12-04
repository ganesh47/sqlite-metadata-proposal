from __future__ import annotations

import csv
import json
import time
import uuid
from pathlib import Path
from typing import Iterable, Sequence

import httpx
from pydantic import ValidationError

from metadata_cli.config import CliSettings
from metadata_cli.db.migrations import MigrationJobStore, MigrationJobRecord
from metadata_cli.errors import DatasetValidationError, IngestionError
from metadata_cli.models import DatasetModel, EdgeModel, NodeModel
from metadata_cli.utils.logging import ProgressLogger


def _batched(items: Sequence, size: int) -> Iterable[Sequence]:
    for start in range(0, len(items), size):
        yield items[start : start + size]


class DatasetLoader:
    """Loads and validates ingest datasets."""

    def __init__(self, data_format: str = "json"):
        self._format = data_format

    def load(self, path: Path) -> DatasetModel:
        if not path.exists():
            raise DatasetValidationError(f"Dataset file {path} does not exist")
        if self._format == "json":
            payloads = [self._load_json(path)]
        elif self._format == "ndjson":
            payloads = list(self._load_ndjson(path))
        elif self._format == "csv":
            payloads = [self._load_csv(path)]
        else:
            raise DatasetValidationError(f"Unsupported dataset format: {self._format}")

        combined = self._merge_payloads(payloads)

        try:
            return DatasetModel.model_validate(combined)
        except ValidationError as exc:
            raise DatasetValidationError(str(exc)) from exc

    def _load_json(self, path: Path) -> dict:
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise DatasetValidationError("Dataset file is not valid JSON") from exc

    def _load_ndjson(self, path: Path) -> Iterable[dict]:
        payloads: list[dict] = []
        try:
            for line in path.read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                payloads.append(json.loads(line))
        except json.JSONDecodeError as exc:
            raise DatasetValidationError("NDJSON file contains invalid JSON line") from exc
        if not payloads:
            raise DatasetValidationError("NDJSON file is empty")
        return payloads

    def _merge_payloads(self, payloads: Sequence[dict]) -> dict:
        merged: dict[str, list] = {"nodes": [], "edges": [], "metadata": {}}
        for payload in payloads:
            merged["nodes"].extend(payload.get("nodes", []))
            merged["edges"].extend(payload.get("edges", []))
            merged["metadata"].update(payload.get("metadata", {}))
        return merged

    def _load_csv(self, path: Path) -> dict:
        nodes: list[dict] = []
        edges: list[dict] = []
        with path.open(encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                clean = {k: v for k, v in row.items() if v not in (None, "", "null")}
                properties = self._coerce_properties(clean.pop("properties", "{}"))
                if "sourceId" in clean and "targetId" in clean:
                    edges.append(
                        {
                            "id": clean.get("id") or uuid.uuid4().hex,
                            "sourceId": clean["sourceId"],
                            "targetId": clean["targetId"],
                            "type": clean.get("type", "link"),
                            "properties": properties,
                        }
                    )
                else:
                    nodes.append(
                        {
                            "id": clean.get("id") or uuid.uuid4().hex,
                            "type": clean.get("type", "node"),
                            "properties": properties,
                            "createdBy": clean.get("createdBy"),
                        }
                    )
        if not nodes and not edges:
            raise DatasetValidationError("CSV file is empty or missing node/edge rows")
        return {"nodes": nodes, "edges": edges, "metadata": {}}

    def _coerce_properties(self, raw: str) -> dict:
        if not raw:
            return {}
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"raw": raw}


class IngestionRunner:
    """Coordinates dataset loading, API calls, and job tracking."""

    def __init__(
        self,
        settings: CliSettings,
        *,
        job_store: MigrationJobStore | None = None,
        http_client: httpx.Client | None = None,
        logger: ProgressLogger | None = None,
    ):
        self.settings = settings
        self.job_store = job_store or MigrationJobStore(settings.job_store_path)
        timeout = httpx.Timeout(connect=10.0, read=60.0, write=30.0, pool=5.0)
        self.http_client = http_client or httpx.Client(timeout=timeout)
        self.logger = logger or ProgressLogger()
        self.loader = DatasetLoader(settings.dataset_format)

    def run(self, dataset_path: Path) -> MigrationJobRecord:
        dataset = self.loader.load(dataset_path)

        metrics = {"nodesAccepted": 0, "edgesAccepted": 0, "batches": 0}
        job_id = uuid.uuid4().hex

        job_record = self.job_store.start_job(job_id=job_id, source=self.settings.source)
        start = time.perf_counter()

        try:
            metrics["nodesAccepted"] = self._ship_collection(
                "nodes", dataset.nodes, job_record.job_id, metrics
            )
            metrics["edgesAccepted"] = self._ship_collection(
                "edges", dataset.edges, job_record.job_id, metrics
            )
            total_items = metrics["nodesAccepted"] + metrics["edgesAccepted"]
            duration = time.perf_counter() - start
            metrics["durationSeconds"] = round(duration, 3)
            job_record = self.job_store.complete_job(
                job_record.job_id, status="succeeded", metrics=metrics
            )
            self.logger.throughput(total_items, duration)
            self.logger.info(
                "ingest.complete",
                job_id=job_record.job_id,
                status=job_record.status,
                nodes=metrics["nodesAccepted"],
                edges=metrics["edgesAccepted"],
                batches=metrics["batches"],
            )
            return job_record
        except DatasetValidationError:
            raise
        except IngestionError as exc:
            self.job_store.complete_job(job_record.job_id, status="failed", metrics=metrics)
            raise exc
        except Exception as exc:  # pragma: no cover - defensive
            self.job_store.complete_job(job_record.job_id, status="failed", metrics=metrics)
            raise IngestionError(str(exc)) from exc

    def _ship_collection(
        self,
        resource: str,
        items: Sequence[NodeModel] | Sequence[EdgeModel],
        job_id: str,
        metrics: dict[str, int | float],
    ) -> int:
        if not items:
            return 0

        total = 0
        path = f"/orgs/{self.settings.org_id}/{resource}"
        url = f"{self.settings.base_url}{path}"

        for batch in _batched(items, self.settings.batch_size):
            payload = {
                "items": [
                    self._decorate_item(model).model_dump(by_alias=True) for model in batch
                ],
                "jobId": job_id,
            }
            response = self.http_client.post(url, headers=self.settings.default_headers, json=payload)
            metrics["batches"] += 1
            self.logger.info(
                "batch.sent",
                endpoint=resource,
                batch_size=len(batch),
                status=response.status_code,
            )
            if response.status_code >= 400:
                raise IngestionError(
                    f"{resource} request failed with status {response.status_code}"
                )
            total += len(batch)

        return total

    def _decorate_item(self, model: NodeModel | EdgeModel) -> NodeModel | EdgeModel:
        payload = model.model_copy()
        actor = self.settings.source
        if isinstance(payload, NodeModel):
            if not payload.createdBy:
                payload.createdBy = actor
            if not payload.updatedBy:
                payload.updatedBy = payload.createdBy
        else:
            if not payload.createdBy:
                payload.createdBy = actor
            if not payload.updatedBy:
                payload.updatedBy = payload.createdBy
        return payload
