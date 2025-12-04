from __future__ import annotations

from io import StringIO

from rich.console import Console

from metadata_cli.utils.logging import ProgressLogger


def test_log_batch_respects_budgets():
    buffer = StringIO()
    logger = ProgressLogger(console=Console(file=buffer, force_terminal=False, color_system=None))

    logger.log_batch(
      endpoint="nodes",
      batch_size=10,
      status=202,
      duration_seconds=0.5,
      rss_mb=100,
      latency_budget_seconds=5,
      rss_budget_mb=256,
    )

    output = buffer.getvalue()
    assert "batch.sent" in output
    assert "endpoint=nodes" in output


def test_log_batch_warns_on_budget_breach():
    buffer = StringIO()
    logger = ProgressLogger(console=Console(file=buffer, force_terminal=False, color_system=None))

    logger.log_batch(
      endpoint="nodes",
      batch_size=10,
      status=202,
      duration_seconds=6,
      rss_mb=300,
      latency_budget_seconds=5,
      rss_budget_mb=256,
    )

    output = buffer.getvalue()
    assert "batch.performance_budget_exceeded" in output
