from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional


def _normalize_url(url: str) -> str:
    return url[:-1] if url.endswith("/") else url


@dataclass(slots=True)
class CliSettings:
    """User-provided settings for running an ingestion job."""

    org_id: str
    api_url: str
    api_token: Optional[str] = None
    batch_size: int = 500
    source: str = "cli"
    dataset_format: str = "json"
    job_store_path: Optional[Path] = None
    dry_run: bool = False

    @property
    def base_url(self) -> str:
        return _normalize_url(self.api_url)

    @property
    def default_headers(self) -> dict[str, str]:
        headers = {"content-type": "application/json"}
        if self.api_token:
            headers["Authorization"] = f"Bearer {self.api_token}"
        return headers

    @classmethod
    def from_options(
        cls,
        *,
        org: str,
        api_url: str,
        api_token: Optional[str],
        batch_size: int,
        source: Optional[str],
        job_store: Optional[Path],
        dataset_format: str,
    ) -> "CliSettings":
        if not org:
            raise ValueError("Organization id is required")
        if not api_url:
            raise ValueError("API URL is required")
        if batch_size <= 0:
            raise ValueError("Batch size must be greater than zero")
        if dataset_format.lower() != "json":
            raise ValueError("Only JSON datasets are supported")
        return cls(
            org_id=org,
            api_url=api_url,
            api_token=api_token,
            batch_size=batch_size,
            source=source or "cli",
            job_store_path=job_store,
            dataset_format=dataset_format.lower(),
        )
