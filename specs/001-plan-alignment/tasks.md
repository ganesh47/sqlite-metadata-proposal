---

description: "Task list for Polyglot Deployment Stack Alignment"
---

# Tasks: Polyglot Deployment Stack Alignment

**Input**: Design documents from `/specs/001-plan-alignment/`
**Prerequisites**: plan.md (required), spec.md (user stories), research.md, data-model.md, contracts/api.yaml, quickstart.md

**Tests**: Each user story includes explicit regression tests derived from the plan (Vitest, pytest, JUnit). Tests appear before implementation tasks inside the story phases so they can be written first and fail prior to coding changes.

**Organization**: Tasks are grouped by user story (US1–US3) to ensure each slice can be implemented, tested, and delivered independently.

**Constitution Alignment**:
- Phase 2 + story phases include linting, formatters, and documentation updates (Principle I).
- Story phases begin with failing tests/harness updates (Principle II).
- Contracts/quickstart/doc updates appear alongside API/CLI/connector work to keep UX consistent (Principles III & V).
- Performance/instrumentation tasks (e.g., Pino metrics, CLI throughput logging, Micrometer heartbeats) enforce latency/RSS budgets (Principle IV).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the polyglot workspace, package directories, and Docker scaffolding from the plan.

- [X] T001 Create initial README stubs documenting scope in `packages/api/README.md`, `packages/cli/README.md`, `packages/connectors/java/README.md`, and `docker/README.md`.
- [X] T002 Define root workspace configuration by adding `package.json` + `pnpm-workspace.yaml` at repo root with references to `packages/*`.
- [X] T003 Add Node.js toolchain files (`.nvmrc`, `.npmrc`) and pnpm lockfile at repository root to fix API build versions.
- [X] T004 Scaffold Python project metadata (`packages/cli/pyproject.toml`, `packages/cli/uv.lock`) with Typer, SQLAlchemy, and Ruff dependencies.
- [X] T005 Initialize Maven multi-module parent `packages/connectors/java/pom.xml` with submodules `core-client`, `connector-template`, and `examples/http-forwarder`.
- [X] T006 Create Docker scaffolding: `docker/api/Dockerfile`, `docker/cli/Dockerfile`, `docker/connector/Dockerfile`, `.dockerignore`, and `docker/api/compose.yml` with stub commands.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that MUST be complete before any user story begins (schema, migrations, CI, compose stack).

- [X] T007 Add shared configuration templates (`.env.example`, `config/defaults.json`) documenting API/CLI/connector env vars per plan in repo root.
- [X] T008 Implement Drizzle schema + models from `data-model.md` in `packages/api/src/db/schema.ts` and ensure migrations live under `packages/api/migrations/`.
- [X] T009 Create migration runner + seed scripts (`packages/api/scripts/migrate.ts`, `packages/api/scripts/seed.ts`) that initialize SQLite WAL mode for local/dev containers.
- [X] T010 Sync the canonical OpenAPI file by copying `specs/001-plan-alignment/contracts/api.yaml` into `packages/api/src/contracts/api.yaml` and add an npm script to regenerate clients.
- [X] T011 Configure `.github/workflows/stack-build.yml` to run ESLint/Vitest, Ruff/pytest, Maven tests, Spectral, Hadolint, Docker Buildx, and SBOM signing per plan.
- [ ] T012 Compose the stack in `docker/compose.stack.yml` wiring API, CLI, and connector images with shared SQLite volume + network for local demos.

**Checkpoint**: Foundation ready – user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 – Deploy Core API Stack (Priority: P1) 🎯 MVP

**Goal**: Ship the Fastify + Drizzle API with health, node, and edge endpoints plus Docker packaging and instrumentation.

**Independent Test**: Run `pnpm vitest run` followed by `docker compose -f docker/api/compose.yml up` and hit `GET /health/ready`, `POST /orgs/:orgId/nodes`, and `POST /orgs/:orgId/edges` locally; all requests return schema-compliant payloads while latency metrics stay within budgets.

### Tests for User Story 1 (MUST be written first)

- [ ] T013 [P] [US1] Create Vitest config + helpers in `packages/api/vitest.config.ts` and `packages/api/tests/setup.ts` enforcing coverage + perf thresholds.
- [ ] T014 [P] [US1] Write `packages/api/tests/health.spec.ts` to hit `/health/ready` and assert WAL + migration metadata matches `contracts/api.yaml`.
- [ ] T015 [P] [US1] Write `packages/api/tests/graph.spec.ts` using Supertest to upsert nodes/edges (success + validation failures) against an in-memory Fastify instance.

### Implementation for User Story 1

- [ ] T016 [US1] Implement Fastify server bootstrap with Pino + CORS plugins in `packages/api/src/server.ts` and wire graceful shutdown hooks.
- [ ] T017 [US1] Add Drizzle data access + repository layer in `packages/api/src/services/graph-service.ts` consuming `schema.ts`.
- [ ] T018 [US1] Implement node/edge routes + validators per contract in `packages/api/src/routes/graph.ts` and register them in `packages/api/src/index.ts`.
- [ ] T019 [US1] Implement `/health/ready` controller in `packages/api/src/routes/health.ts` that checks migration status + SQLite pragmas.
- [ ] T020 [US1] Integrate latency + RSS metrics (Pino serializers, histogram export) in `packages/api/src/plugins/metrics.ts` respecting Principle IV budgets.
- [ ] T021 [US1] Harden documentation by updating `packages/api/README.md` and `specs/001-plan-alignment/quickstart.md` with env vars, curl examples, and failure modes.
- [ ] T022 [US1] Produce the multi-stage API image by finishing `docker/api/Dockerfile` + `docker/api/.dockerignore` and document build/push commands in `docker/README.md`.

**Checkpoint**: User Story 1 is independently deployable as the MVP when tests + Docker image succeed.

---

## Phase 4: User Story 2 – Ingest Metadata via Python CLI (Priority: P1)

**Goal**: Deliver a Python Typer CLI + Docker image that ingests datasets into SQLite, logs progress, and records `MigrationJob` metadata.

**Independent Test**: Execute `docker run ghcr.io/.../sqlite-meta-cli ingest --org org1 --file fixtures/sample.json` using the compose stack; verify via `sqlite3` that nodes/edges + migration_job rows exist and that invalid input exits non-zero with no DB changes.

### Tests for User Story 2

- [ ] T023 [P] [US2] Configure pytest + Ruff by adding `packages/cli/pytest.ini`, `packages/cli/tests/conftest.py`, and failing fixtures that spin up temp SQLite files.
- [ ] T024 [P] [US2] Write regression tests in `packages/cli/tests/test_ingest_sample.py` covering success ingest, validation failure, and rollback semantics.

### Implementation for User Story 2

- [ ] T025 [US2] Implement Typer entrypoint + CLI options in `packages/cli/src/main.py`, including env overrides for API URL, org, and batch size.
- [ ] T026 [US2] Build ingestion + validation pipeline (`packages/cli/src/services/ingest.py`) that maps datasets into GraphNode/GraphEdge models, enforces schema, and writes audit fields.
- [ ] T027 [US2] Add migration job tracker + persistence helpers in `packages/cli/src/db/migrations.py` aligning with `MigrationJob` entity.
- [ ] T028 [US2] Stream structured logs + throughput metrics from the CLI in `packages/cli/src/utils/logging.py`, honoring `<5s` batch SLA and `<256MB` RSS budget.
- [ ] T029 [US2] Package CLI Docker image by finalizing `docker/cli/Dockerfile` and entry script `packages/cli/scripts/docker-entrypoint.sh`, plus update `packages/cli/README.md`.

**Checkpoint**: CLI can ingest data and be distributed as a standalone Docker image, independent of other user stories.

---

## Phase 5: User Story 3 – Build Java Connectors (Priority: P2)

**Goal**: Provide Maven-based connector template + example that streams metadata to the API, reports heartbeats, and ships as Docker images.

**Independent Test**: From `packages/connectors/java/examples/http-forwarder`, run `mvn verify` then `docker run ...` against the compose stack; verify events land via API contract tests and `/connectors/{connectorId}/heartbeat` receives periodic status.

### Tests for User Story 3

- [ ] T030 [P] [US3] Configure integration test harness with Testcontainers in `packages/connectors/java/integration-tests/pom.xml` + `.../src/test/java/.../ApiContractTest.java` hitting stubbed API endpoints.
- [ ] T031 [P] [US3] Add unit tests for the connector template in `packages/connectors/java/connector-template/src/test/java/.../ConnectorServiceTest.java` covering batching + retry logic.

### Implementation for User Story 3

- [ ] T032 [US3] Finalize Maven multi-module structure + BOM definitions inside `packages/connectors/java/pom.xml`, ensuring Java 21, Spotless, and Checkstyle run by default.
- [ ] T033 [US3] Generate OpenAPI client + DTOs from `specs/001-plan-alignment/contracts/api.yaml` into `packages/connectors/java/core-client/src/main/java/...`.
- [ ] T034 [US3] Implement Spring Boot connector template with ingestion + heartbeat services in `packages/connectors/java/connector-template/src/main/java/...`.
- [ ] T035 [US3] Build the HTTP forwarder example under `packages/connectors/java/examples/http-forwarder/` with configuration docs and Micrometer metrics export.
- [ ] T036 [US3] Produce connector Docker image + startup scripts via `docker/connector/Dockerfile` and expose push commands in `.github/workflows/stack-build.yml`.

**Checkpoint**: Connectors compile, pass tests, emit heartbeats, and publish Docker images ready for downstream teams.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T037 Update `sqlite-metadata-system.md` §12 (Next Steps) and `docs/process.md` to reflect the approved TypeScript/Python/Java + Docker workflow.
- [ ] T038 Add SBOM + signing automation scripts in `scripts/publish-images.sh` and document usage in `docker/README.md`.
- [ ] T039 Capture release notes + demo procedures in `docs/notes/$(date).md` summarizing image locations, perf benchmarks, and outstanding risks.

---

## Dependencies & Execution Order

- **Phase Dependencies**
  - Setup (Phase 1) → unlocks foundational work.
  - Foundational (Phase 2) → MUST complete before any user story; ensures schema, contracts, CI, and compose stack exist.
  - User Story 1 (US1) delivers the MVP API; User Story 2 can start after Phase 2 but depends on API contracts being stable (from US1 tests) for end-to-end validation.
  - User Story 3 depends on US1 contracts and benefits from US2 ingestion samples but can begin once OpenAPI client + compose stack exist.
  - Polish phase runs after all desired stories complete.

- **Story Completion Order**
  1. US1 – Deploy Core API Stack (P1, MVP)
  2. US2 – Ingest Metadata via Python CLI (P1, parallel-friendly once API endpoints stubbed)
  3. US3 – Build Java Connectors (P2, depends on finalized API contracts + compose stack)

## Parallel Execution Examples

- **US1**: T014 (health tests) and T015 (graph tests) can be authored simultaneously while another contributor implements T016 server bootstrap.
- **US2**: T023/T024 pytest tasks run in parallel with T025 Typer entrypoint scaffolding because they rely on fixture DBs, not final API deployments.
- **US3**: T030 Testcontainers harness can progress while T033 OpenAPI client generation runs, since they only share the published contract file.

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phases 1–2 to establish repo + schema + CI.
2. Deliver US1 (API image + endpoints + tests).
3. Stop to validate compose stack + performance budgets before layering additional clients.

### Incremental Delivery
1. US2 adds ingestion automation immediately after US1 stabilizes.
2. US3 follows with connectors once API + CLI artifacts are available, keeping each deliverable independently testable.
3. Polish tasks ensure documentation, SBOM signing, and release notes stay aligned with the constitution.
