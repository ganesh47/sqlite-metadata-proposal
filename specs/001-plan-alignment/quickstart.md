# Quickstart – Polyglot Deployment Stack

## Prerequisites
- Docker 26.x with Buildx enabled.
- Node.js 20 LTS + pnpm 9.x for local API development.
- Python 3.12 with `uv` or `pipx`.
- Java 21 + Maven 3.9.
- SQLite 3.45 binaries (for local inspection).

## 1. Build Images

```bash
# API
docker build -f docker/api/Dockerfile -t ghcr.io/ganesh47/sqlite-meta-api:dev .

# Python CLI
docker build -f docker/cli/Dockerfile -t ghcr.io/ganesh47/sqlite-meta-cli:dev .

# Java connector template (example: events-http)
docker build -f docker/connector/Dockerfile -t ghcr.io/ganesh47/sqlite-meta-connector-http:dev .
```

Each Dockerfile emits an SBOM and signature (see `docker/README.md`) and keeps compressed size <400 MB.

## 2. Run API + SQLite

```bash
docker compose -f docker/api/compose.yml up -d
curl http://localhost:8080/health/ready
```

The readiness payload must match `contracts/api.yaml#HealthResponse`. Pino logs show latency histograms to validate Principle IV budgets.

## 3. Ingest Sample Data via CLI

```bash
docker run --rm \
  -v $(pwd)/samples/org1.sqlite:/data/db.sqlite \
  ghcr.io/ganesh47/sqlite-meta-cli:dev \
  ingest --org org1 --file fixtures/sample-nodes.json

sqlite3 samples/org1.sqlite "select count(*) from graph_nodes;"
```

CLI progress output highlights throughput (target: 100k edges/min) and records job artifacts in the `MigrationJob` table.

## 4. Deploy Java Connector

```bash
cd packages/connectors/java/examples/http-forwarder
mvn -DskipTests=false test package
docker run --rm ghcr.io/ganesh47/sqlite-meta-connector-http:dev \
  --api-url http://host.docker.internal:8080 --org org1 --token $API_TOKEN
```

Connector heartbeats call `POST /connectors/{connectorId}/heartbeat` every 30 s. Micrometer metrics export to stdout and can be scraped by Prometheus once deployed.

## 5. Validate Contracts & Docs

1. Run `pnpm spectral lint specs/001-plan-alignment/contracts/api.yaml`.
2. Execute `pytest`, `vitest`, and `mvn test` to ensure all suites pass before pushing.
3. Update `sqlite-metadata-system.md` §12 and `docs/process.md` with any workflow changes introduced by this stack.
