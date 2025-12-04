from __future__ import annotations

from pathlib import Path
from typing import Optional

import typer

from metadata_cli.config import CliSettings
from metadata_cli.errors import CLIError, DatasetValidationError
from metadata_cli.services.ingest import IngestionRunner

app = typer.Typer(help="SQLite metadata ingestion CLI.", add_completion=False)


@app.command()
def ingest(
    dataset_format: str = typer.Option(
        "json",
        "--dataset-format",
        envvar="CLI_DATASET_FORMAT",
        help="Dataset format (currently only json).",
    ),
    file: Path = typer.Argument(..., exists=True, readable=True, help="Dataset file to ingest."),
    org: str = typer.Option(..., "--org", "-o", help="Organization identifier."),
    api_url: str = typer.Option(
        None,
        "--api-url",
        envvar="API_URL",
        help="Base URL for the metadata API (e.g. https://api.local).",
    ),
    api_token: Optional[str] = typer.Option(
        None,
        "--api-token",
        envvar="API_TOKEN",
        help="Bearer token for authenticating with the API.",
    ),
    batch_size: int = typer.Option(
        500,
        "--batch-size",
        envvar="CLI_BATCH_SIZE",
        min=1,
        help="Number of nodes/edges to send per request.",
    ),
    source: Optional[str] = typer.Option(
        "cli",
        "--source",
        envvar="CLI_SOURCE",
        help="Identifier recorded in job metadata.",
    ),
    job_store: Optional[Path] = typer.Option(
        None,
        "--job-store",
        envvar="CLI_JOB_STORE",
        help="Optional path for the local job history SQLite file.",
    ),
) -> None:
    """Ingest nodes and edges into the metadata API."""
    try:
        settings = CliSettings.from_options(
            org=org,
            api_url=api_url or "",
            api_token=api_token,
            batch_size=batch_size,
            source=source,
            job_store=job_store,
            dataset_format=dataset_format,
        )
    except ValueError as exc:
        typer.secho(f"Configuration error: {exc}", err=True, fg=typer.colors.RED)
        raise typer.Exit(code=2) from exc

    runner = IngestionRunner(settings=settings)

    try:
        job = runner.run(file)
    except DatasetValidationError as exc:
        typer.secho(f"Dataset invalid: {exc}", err=True, fg=typer.colors.RED)
        raise typer.Exit(code=3) from exc
    except CLIError as exc:
        typer.secho(f"Ingestion failed: {exc}", err=True, fg=typer.colors.RED)
        raise typer.Exit(code=1) from exc

    color = typer.colors.GREEN if job.status == "succeeded" else typer.colors.YELLOW
    typer.secho(
        f"Job {job.job_id} finished with status={job.status} nodes={job.metrics.get('nodesAccepted', 0)} "
        f"edges={job.metrics.get('edgesAccepted', 0)}",
        fg=color,
    )
