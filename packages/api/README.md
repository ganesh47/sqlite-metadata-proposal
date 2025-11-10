# API Service (Fastify + Drizzle)

This package ships the Fastify service described in `specs/001-plan-alignment/contracts/api.yaml`. It persists metadata in SQLite via Drizzle ORM and exposes REST endpoints for health probes, node upserts, and edge upserts.

## Runtime Configuration

| Variable | Default | Notes |
|----------|---------|-------|
| `SQLITE_PATH` | `data/metadata.sqlite` | File path for the primary SQLite database (WAL enabled automatically). |
| `API_PORT` | `8080` | Listen port for HTTP traffic. |
| `API_HOST` | `0.0.0.0` | Bind address for the Fastify server. |
| `LOG_LEVEL` | `info` | Pino log level (`debug` shows request/metrics traces). |

The server instruments every request with the metrics plugin in `src/plugins/metrics.ts`. Requests that exceed the `<200ms` / `<100ms` latency or `256MB` RSS budgets emit `Performance budget exceeded` warnings directly in the logs.

## Local Development

```bash
nvm use 20
pnpm install
pnpm --filter metadata-api run migrate   # applies SQL in packages/api/migrations
pnpm --filter metadata-api run start:dev
```

`start:dev` launches the Fastify instance with ts-node so code changes are reflected without rebuilding. Use `pnpm --filter metadata-api run test` to execute the Vitest suites (`tests/health.spec.ts`, `tests/graph.spec.ts`) and verify schema alignment before committing.

## Example Requests

```bash
# Readiness probe – mirrors HealthResponse in the OpenAPI spec
curl http://localhost:8080/health/ready | jq

# Upsert nodes
curl -X POST http://localhost:8080/orgs/demo-org/nodes \
  -H 'content-type: application/json' \
  -d '{"items":[{"id":"node-1","type":"workspace","properties":{},"createdBy":"cli"}]}'

# Upsert edges (requires prior node inserts because of FK constraints)
curl -X POST http://localhost:8080/orgs/demo-org/edges \
  -H 'content-type: application/json' \
  -d '{"items":[{"id":"edge-1","sourceId":"node-1","targetId":"node-2","type":"link","properties":{}}]}'
```

Failure responses follow the `ErrorResponse` schema:

- `400 INVALID_NODE_UPSERT` / `400 INVALID_EDGE_UPSERT` ⇒ request body failed validation (missing `items`, schema mismatch, FK violation, etc.).
- `503` ⇒ readiness probe detected missing migrations or WAL not enabled (check `sqlite.migrations` + `sqlite.wal_checkpointed` in the response body).

## Docker

`docker/api/Dockerfile` builds the production image by compiling TypeScript (`pnpm --filter metadata-api run build`), moving the package into `/opt/app` via `pnpm deploy`, and running `node dist/index.js` inside a minimal Node 20 runtime. See `docker/README.md` for the build/push commands and SBOM guidance.
