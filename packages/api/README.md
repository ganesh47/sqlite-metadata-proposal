# API Service (Fastify + Drizzle)

This package hosts the Node.js 20 Fastify service that exposes the metadata API described in `specs/001-plan-alignment/contracts/api.yaml`.

## Responsibilities
- Serve `/health/ready`, node, and edge endpoints with the request/response shapes defined in the spec
- Manage SQLite migrations via Drizzle and expose WAL health data for readiness
- Emit structured Pino logs and latency histograms to honor the performance budgets (<200ms p95 writes / <100ms p95 reads)

## Next Steps
See `specs/001-plan-alignment/tasks.md` (US1) for the Vitest suites, Drizzle schema, and Docker packaging work that will live here.
