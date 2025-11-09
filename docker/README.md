# Docker Artifacts

This folder will hold the multi-stage Dockerfiles and compose files referenced throughout the plan:

- `docker/api/Dockerfile` – builds the Fastify API image with Drizzle migrations baked in
- `docker/cli/Dockerfile` – packages the Typer ingestion CLI for air-gapped execution
- `docker/connector/Dockerfile` – ships the Spring Boot connector template
- `docker/api/compose.yml` – runs the API + SQLite stack locally for smoke tests

Each image MUST embed SBOM data (syft) and be signed (cosign) before publishing to GHCR. See `specs/001-plan-alignment/quickstart.md` for the build/test commands that will live here once the files are added.
