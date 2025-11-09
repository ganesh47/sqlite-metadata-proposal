# sqlite-metadata-proposal Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-09

## Active Technologies

- API: TypeScript 5.4 on Node.js 20 LTS with Fastify 5, Drizzle, and Pino
- CLI: Python 3.12 with Typer, SQLAlchemy, Ruff, and Docker 26.x base images
- Connectors: Java 21 LTS using Maven 3.9 + Spring Boot 3.3 + Micrometer
- Shared tooling: GitHub Actions CI, SBOM signing, feature reference 001-plan-alignment

## Project Structure

```text
src/
tests/
```

## Commands

```bash
# API
cd packages/api && pnpm lint && pnpm vitest

# CLI
cd packages/cli && uv run ruff check . && uv run pytest

# Java connectors
cd packages/connectors/java && mvn --batch-mode verify
```

## Code Style

TypeScript 5.4 on Node.js 20 LTS (API),
Python 3.12 (CLI),
Java 21 LTS (connectors):
Follow standard conventions from plan/spec.

## Recent Changes

- 001-plan-alignment:
  Captured the API (TypeScript/Node/Fastify),
  CLI (Python/Typer/SQLAlchemy),
  and connector stack (Java/Spring Boot/Maven),
  plus shared Docker + CI requirements.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
