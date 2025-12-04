# Python CLI (Typer Ingestion Tool)

The ingestion CLI reads JSON datasets, validates them with Pydantic, batches nodes/edges, and streams
them to the Fastify API using the same OpenAPI contract as the other clients. Each run records
`MigrationJob` metadata in a lightweight SQLite store so operators can audit throughput.

## Usage

```bash
uv run metadata-cli ingest \
  --org demo-org \
  --api-url http://localhost:8080 \
  --file fixtures/sample-dataset.json \
  --batch-size 250
```

### Required arguments

- `--org / -o`: Tenant/org id that maps to the API path parameter.
- `--api-url`: Base URL for the API (also read from `API_URL`).
- `--file`: Path to a JSON document containing `nodes` and/or `edges` arrays.

### Optional arguments

- `--api-token` (`API_TOKEN`): Bearer token sent with each request.
- `--batch-size` (`CLI_BATCH_SIZE`): Request payload size (default `500`).
- `--source` (`CLI_SOURCE`): Label recorded in job metadata (`cli` by default).
- `--dataset-format` (`CLI_DATASET_FORMAT`): Dataset format (`json`, `ndjson`, or `csv`). CSV must include headers for nodes (`id`, `type`, `properties`) and edges (`sourceId`, `targetId`, `type`, `properties`); rows with `sourceId` + `targetId` are treated as edges. `createdBy`/`updatedBy` default to `--source` when omitted.
- `--job-store` (`CLI_JOB_STORE`): Location for the local job-history SQLite DB. Defaults to
  `~/.metadata-cli/jobs.sqlite`.

## Development

```bash
# Lint + format
uv run ruff check src

# Run unit tests
uv run pytest

# Lint + test everything (includes tests directory in Ruff config)
uv run ruff check
uv run pytest --maxfail=1 --disable-warnings
```

The CLI code lives under `src/metadata_cli/` with the following structure:

- `main.py`: Typer entrypoint and argument parsing
- `services/ingest.py`: Dataset loader, API client, and migration job orchestration
- `db/migrations.py`: SQLite-backed job history store
- `utils/logging.py`: Structured console logging + throughput helpers

## Docker Image

The Dockerfile at `docker/cli/Dockerfile` builds the CLI on `python:3.12-slim`, installs dependencies
with `uv`, and sets `/usr/local/bin/metadata-cli-entrypoint` as the container entrypoint. Example:

```bash
docker build -f docker/cli/Dockerfile -t ghcr.io/ganesh47/sqlite-meta-cli:dev .
docker run --rm \
  -e API_URL=http://host.docker.internal:8080 \
  -e API_TOKEN=$API_TOKEN \
  -v $(pwd)/data:/data \
  ghcr.io/ganesh47/sqlite-meta-cli:dev \
  ingest --org demo-org --file /data/sample.json
```

Notes:
- The image runs as a non-root `metadata` user and writes the job store to `/data/jobs.sqlite` by default—mount a host volume to `/data` to persist history.
- Use `--ignorefile docker/cli/.dockerignore` when building from repo root to shrink context.
