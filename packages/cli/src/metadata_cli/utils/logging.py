from __future__ import annotations

import resource
import time
from typing import Any

from rich.console import Console


class ProgressLogger:
    """Structured logger emitting ingestion progress events."""

    def __init__(self, console: Console | None = None):
        self._console = console or Console()

    def info(self, message: str, **fields: Any) -> None:
        if fields:
            kv = " ".join(f"{key}={value}" for key, value in fields.items())
            self._console.log(f"{message} | {kv}")
        else:
            self._console.log(message)

    def warn(self, message: str, **fields: Any) -> None:
        kv = " ".join(f"{key}={value}" for key, value in fields.items())
        self._console.log(f"[yellow]{message}[/yellow] | {kv}")

    def throughput(self, items: int, duration_seconds: float) -> None:
        rate = 0 if duration_seconds <= 0 else round(items / duration_seconds, 2)
        self.info(
            "throughput",
            items=items,
            duration=f"{duration_seconds:.3f}s",
            items_per_second=rate,
        )

    def log_batch(
        self,
        *,
        endpoint: str,
        batch_size: int,
        status: int,
        duration_seconds: float,
        rss_mb: float,
        latency_budget_seconds: float,
        rss_budget_mb: float,
    ) -> None:
        fields = {
            "endpoint": endpoint,
            "batch_size": batch_size,
            "status": status,
            "duration": f"{duration_seconds:.3f}s",
            "rss_mb": round(rss_mb, 2),
        }
        if duration_seconds > latency_budget_seconds or rss_mb > rss_budget_mb:
            self.warn("batch.performance_budget_exceeded", **fields)
        else:
            self.info("batch.sent", **fields)

    def time_block(self, label: str):
        start = time.perf_counter()

        class _Timer:
            def __enter__(self_inner):
                return self_inner

            def __exit__(self_inner, exc_type, exc, tb):
                duration = time.perf_counter() - start
                self.info(label, duration=f"{duration:.3f}s")

        return _Timer()


def get_rss_mb() -> float:
    """Return resident set size in MB using resource module (portable enough for CI/containers)."""
    usage = resource.getrusage(resource.RUSAGE_SELF)
    rss_kb = usage.ru_maxrss
    # On Linux ru_maxrss is kilobytes; on macOS it's bytes. Normalize by assuming >1e6 means bytes.
    if rss_kb > 1_000_000:
        return rss_kb / (1024 * 1024)
    return rss_kb / 1024
