# Python CLI (Typer Ingestion Tool)

This directory will contain the Typer-based ingestion CLI that converts datasets (e.g., YouTube8M) into GraphNode/GraphEdge rows inside SQLite.

## Responsibilities
- Provide `ingest` and diagnostic commands matching the acceptance criteria in the user story
- Validate dataset schema before writes and capture MigrationJob metadata for every run
- Package as a Docker image (`docker/cli/Dockerfile`) with UV-managed dependencies and Ruff linting

## Next Steps
Implementation tasks live under US2 in `specs/001-plan-alignment/tasks.md` (tests first, then Typer services and Docker entrypoints).
