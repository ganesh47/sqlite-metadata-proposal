# Feature Specification: Plan Alignment – Polyglot Deployment Stack

**Feature Branch**: `001-plan-alignment`  
**Created**: 2025-11-09  
**Status**: Draft  
**Input**: User description: "You can use java (using maven, latest stable), python and typescript for all things. Use docker and docker images as final packages."
**Authoritative References** (per Constitution V - Spec-Driven Delivery):
- `sqlite-metadata-system.md` §3 (Vision & Design Principles) and §4 (High-Level Architecture) define the API/graph behaviors this feature must honor.
- `docs/process.md` defines the repo workflow and CI expectations for generated artifacts.
- `docs/project-readme.md` Quick Links ensure onboarding docs stay consistent with the new stack choices.
- Future implementation MUST update `sqlite-metadata-system.md` §12 (Next Steps) to reflect approved scope and language boundaries.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Deploy Core API Stack (Priority: P1)

Platform operators need a repeatable way to run the Fastify-based API service as a Docker image with TypeScript sources and Drizzle migrations.

**Why this priority**: API availability underpins every other workflow.

**Independent Test**: Provision a clean environment, run `docker compose up api`, and execute the published health check plus CRUD smoke tests; no other components required.

**Acceptance Scenarios**:

1. **Given** the TypeScript service source and Docker build instructions, **When** the operator runs the provided build command, **Then** a versioned image is produced and pushed to the registry.
2. **Given** the API container is running, **When** `GET /health/ready` is hit, **Then** it returns 200 with schema-compliant payload and Drizzle migrations applied.

---

### User Story 2 - Ingest Metadata via Python CLI (Priority: P1)

Data engineers must ingest datasets (e.g., YouTube8M) using a Python CLI packaged as a Docker image to run in CI or air-gapped machines.

**Why this priority**: Without ingestion, the graph stays empty.

**Independent Test**: Execute `docker run metadata-cli ingest sample.json` against a local SQLite file and validate nodes/edges created via inspection query.

**Acceptance Scenarios**:

1. **Given** a CSV/JSON dataset, **When** the CLI runs with the correct schema mapping, **Then** new nodes and edges appear in SQLite with audit metadata.
2. **Given** invalid input, **When** the CLI runs, **Then** it exits non-zero and writes structured errors to stderr while leaving DB untouched.

---

### User Story 3 - Build Java Connectors (Priority: P2)

Integration teams extend the platform with Java-based (Maven) connectors that stream metadata into the API using the same contracts and package them as Docker images for deployment.

**Why this priority**: Enterprises often need JVM integration for legacy systems.

**Independent Test**: Scaffold a Maven module, run `mvn test package`, build the Docker image, and verify it pushes data through the API using contract tests.

**Acceptance Scenarios**:

1. **Given** a Maven archetype, **When** a developer generates a connector project, **Then** the resulting module compiles, runs tests, and exposes configuration hooks documented in the quickstart.
2. **Given** the connector Docker image, **When** it runs with provided env vars, **Then** it authenticates to the API and emits sample metadata events end-to-end.

---

### Edge Cases

- What happens when Docker builds fail due to missing platform-specific dependencies?
- How does the system handle mixed-version clients (Python CLI vN, Java connector vN+1) hitting the same API contracts?
- What if ingestion jobs need offline mode (no registry access) — how are images distributed?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST ship a TypeScript Fastify API service with Drizzle migrations and produce a Docker image via a reproducible build (refs `sqlite-metadata-system.md` §4.1).
- **FR-002**: System MUST provide a Python CLI (Typer or Click) capable of ingesting datasets into SQLite, packaged as a Docker image.
- **FR-003**: System MUST offer a Maven archetype + starter library for Java ingestion connectors, including CI-ready Dockerfiles.
- **FR-004**: All images MUST embed health/diagnostic endpoints (HTTP for API, CLI self-check command, connector heartbeat) to satisfy Principle IV performance monitoring.
- **FR-005**: Documentation (proposal, quickstarts, README) MUST describe how each artifact aligns with UX expectations (pagination, error payloads).
- **FR-006**: System MUST default to the following stacks unless exceptions are recorded: TypeScript 5.x + Fastify for API, Python 3.12 for CLI, Java 21 LTS for connectors, Maven 3.9.x for builds.
- **FR-007**: Docker images MUST be published with SBOM metadata and size budgets (<400MB compressed) to preserve portability.

### Key Entities *(include if feature involves data)*

- **GraphNode**: Represents metadata entities persisted in SQLite; required fields `id`, `org_id`, `type`, `properties`, `created_at`, `created_by`.
- **GraphEdge**: Directed relationship between nodes; includes `source_id`, `target_id`, edge `type`, and audit metadata.
- **MigrationJob**: Tracks ingestion or schema operations triggered by CLI or connectors; includes `job_id`, `source`, `status`, `metrics`, timestamps.

### Code Quality & Maintainability Guardrails

- TypeScript API follows ESLint + Prettier config; enforce strict TS and Drizzle schema definitions stored under `packages/api`.
- Python CLI uses `ruff` + `black`; documentation coverage via `mkdocs` snippet regen.
- Java connectors enforce `spotless` or `maven-checkstyle-plugin`; shared proto/OpenAPI client generated once and consumed by connectors.
- Each artifact ships with README snippets plus integration tests to prevent drift from `sqlite-metadata-system.md`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: API Docker image builds and passes smoke tests in <5 minutes on standard CI hardware.
- **SC-002**: Python CLI ingests 1M nodes in <5 minutes locally with <256MB RSS.
- **SC-003**: Java connector archetype generates a runnable project that passes tests on first attempt.
- **SC-004**: Documentation updates (proposal + quickstarts) land alongside code changes with zero lint warnings.

### Performance & Instrumentation Targets

- **Latency Budgets**: `<200ms p95` for write endpoints, `<100ms p95` for read endpoints enforced via Fastify hooks.
- **Throughput/Scale**: API handles 1k req/s on a single container; CLI processes 100k edges/min; connectors batch in 500 msg chunks.
- **Resource Caps**: API container RSS `<256MB`, CLI/connector containers `<512MB` during ingestion spikes.
- **User Experience Signals**: CLI exposes progress bars/logs; connectors emit structured logs; Docker images include label metadata for quick identification.
