# Research – Polyglot Deployment Stack Alignment

## Fastify API Stack
- **Decision**: Build the API with TypeScript 5.4 on Node.js 20 LTS using Fastify 5, Drizzle ORM, and ship it via a multi-stage Dockerfile (node:20-bookworm-slim → distroless for runtime) with pnpm.
- **Rationale**: Aligns with `sqlite-metadata-system.md` §3–4 recommendations, keeps bundle size small (<150 MB), and provides first-class TypeScript typings plus excellent throughput for the `<200 ms p95` budget.
- **Alternatives considered**: NestJS (adds DI overhead with limited gain for this thin service), Express (slower + less structured middleware), Bun (still maturing; missing enterprise support today).

## Python CLI Packaging
- **Decision**: Use Python 3.12 with Typer (click-based) + SQLAlchemy and package via `python:3.12-slim` Docker base using `pipx`/`uv` to install locked dependencies; provide both module and container entrypoints.
- **Rationale**: Typer gives ergonomic commands + auto-docs, Python 3.12 is latest stable with performance improvements, and slim base keeps the compressed image <250 MB while meeting CLI usability requirements.
- **Alternatives considered**: Poetry-based packaging (adds dependency on virtualenv mgmt, slower cold starts), Go-based CLI (violates user constraint to stay within Java/Python/TypeScript), Conda (heavier base image).

## Java Connector Template
- **Decision**: Provide a Maven 3.9 multi-module template using Spring Boot 3.3 (virtual threads enabled) + WebClient, bundled as `eclipse-temurin:21-jre` Docker images with layered jars.
- **Rationale**: Spring Boot offers familiar patterns for enterprise teams, integrates with Micrometer metrics for Principle IV budgets, and Maven keeps build tooling aligned with repo guidance; layered jars reduce rebuild time.
- **Alternatives considered**: Quarkus (fast but less familiar to target audience), Micronaut (similar features but smaller ecosystem), Gradle (flexible but diverges from Maven-only requirement).

## Container Registry & SBOM Strategy
- **Decision**: Publish images to GitHub Container Registry (GHCR) with `oras`-attached SBOMs generated via `syft`, sign them with `cosign`, and document air-gapped distribution via `docker save`.
- **Rationale**: GHCR integrates with existing GitHub Actions, supports immutable tags, and `syft+cosign` satisfies supply-chain expectations while enabling offline mirroring. Matches user directive to deliver Docker images as the final packages.
- **Alternatives considered**: Docker Hub (rate limits + external dependency), self-hosted registry (extra ops burden before MVP), Trivy SBOM only (lacks signing workflow).
