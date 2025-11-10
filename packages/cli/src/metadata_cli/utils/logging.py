from __future__ import annotations

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

    def throughput(self, items: int, duration_seconds: float) -> None:
        rate = 0 if duration_seconds <= 0 else round(items / duration_seconds, 2)
        self.info(
            "throughput",
            items=items,
            duration=f"{duration_seconds:.3f}s",
            items_per_second=rate,
        )

    def time_block(self, label: str):
        start = time.perf_counter()

        class _Timer:
            def __enter__(self_inner):
                return self_inner

            def __exit__(self_inner, exc_type, exc, tb):
                duration = time.perf_counter() - start
                self.info(label, duration=f"{duration:.3f}s")

        return _Timer()
