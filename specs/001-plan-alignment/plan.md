# Implementation Plan: Polyglot Deployment Stack Alignment

**Branch**: `001-plan-alignment` | **Date**: 2025-11-09 | **Spec**: [/specs/001-plan-alignment/spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-plan-alignment/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable the SQLite Metadata Platform to ship production-ready Docker images for the TypeScript Fastify API, Python ingestion CLI, and Java (Maven) connectors. We will standardize the tech stack (Node.js 20 + Fastify 5 + Drizzle, Python 3.12 + Typer, Java 21 + Spring Boot), wire them to the canonical contracts in `sqlite-metadata-system.md`, and document end-to-end workflows (quickstart + contracts) so each artifact can be delivered independently yet remain spec-aligned.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.4 on Node.js 20 LTS (API), Python 3.12 (CLI), Java 21 LTS (connectors)  
**Primary Dependencies**: Fastify 5, Drizzle ORM + SQLite driver, Pino logging, Typer + SQLAlchemy, Maven 3.9 + Spring Boot 3.3 + OpenAPI-generated client, Docker 26.x, GitHub Actions CI  
**Storage**: SQLite 3.45 (WAL mode) with Litestream/LiteFS option for replicas; local volumes mounted into Docker containers  
**Testing**: Vitest + Supertest for API, pytest + sqlite fixtures for CLI, JUnit 5 + Testcontainers for connectors, Spectral for OpenAPI lint, Hadolint for Dockerfiles  
**Target Platform**: Linux x86_64 containers (Docker/OCI), optional ARM builds via Buildx; local dev on macOS/Linux  
**Project Type**: Polyglot mono-repo with `packages/api`, `packages/cli`, `packages/connectors/java`, shared contracts + tooling  
**Performance Goals**: API 1k req/s with `<200ms p95` writes/`<100ms p95` reads; CLI ingests 1M nodes in <5 min using <256MB RSS; connectors batch 500 events/second sustained  
**Constraints**: Docker images <400MB compressed; containers <256MB RSS (API) / <512MB (CLI/connector) except short spikes; offline-friendly builds (no private registries)  
**Scale/Scope**: Initial release targets 3 orgs, millions of nodes/edges per org, 2 connector templates, GitHub Actions workflows for build/test/push, and quickstart covering standalone + compose deployment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Code Quality Is Enforced** – ESLint/Prettier (API), Ruff/Black (CLI), Maven Spotless/Checkstyle (connectors) become blocking CI jobs; every Dockerfile linted with Hadolint; proposal + quickstart + README snippets updated in the same PR to describe the new stack and images.
- **II. Testing Proves Every Change** – Vitest suites cover API routes + migrations; pytest runs ingestion fixtures that must fail before implementation; Java modules run JUnit contract tests hitting the API stub container. CI runs all suites plus Spectral + container smoke tests per push.
- **III. Experience Consistency Across Surfaces** – OpenAPI contracts in `/specs/001-plan-alignment/contracts/api.yaml` drive generated clients for CLI + connectors; quickstart documents identical pagination/error payloads; any deviation requires an ADR + migration guide.
- **IV. Performance Budgets Are Contracts** – Pino hooks capture latency histograms, CLI measures ingestion throughput via rich progress output, connectors export Micrometer metrics. Budgets (<200ms write, <100ms read, <256MB RSS API, <5s CLI batch) enforced via regression tests in CI.
- **V. Spec-Driven Delivery** – All tasks trace back to `sqlite-metadata-system.md` §3-4 & §12 and this spec. Every module change references the plan + spec in PR templates; `specs/001-plan-alignment` docs stay the single source for requirements, models, and contracts.

## Project Structure

### Documentation (this feature)

```text
specs/001-plan-alignment/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.yaml
└── tasks.md              # generated in Phase 2 via /speckit.tasks
```

### Source Code (repository root)

```text
packages/
├── api/                  # Fastify service, Drizzle schema, ESLint config
├── cli/                  # Python Typer ingestion tool, Ruff config
└── connectors/
    └── java/             # Maven multi-module template + shared libs

docker/
├── api/ Dockerfile       # Node20-alpine base with pnpm
├── cli/ Dockerfile       # python:3.12-slim base
└── connector/ Dockerfile # eclipse-temurin:21-jre

specs/
└── 001-plan-alignment/   # current feature docs

.github/workflows/
└── stack-build.yml       # CI matrix for images + tests (to be added)
```

**Structure Decision**: Adopt a packages-first mono-repo so API, CLI, and Java connectors share tooling yet release independently. Dockerfiles live under `docker/` for clarity, and workflows consume both `packages/*` and `specs/001-plan-alignment` artifacts.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _None_ | — | — |
