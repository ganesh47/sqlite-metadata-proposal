# Docker Artifacts

This directory contains the multi-stage Dockerfiles and compose stacks described in `specs/001-plan-alignment/plan.md`.

## API Image (`docker/api/Dockerfile`)

```bash
docker build \
  --ignorefile docker/api/.dockerignore \
  -f docker/api/Dockerfile \
  --build-arg BUILD_SHA=$(git rev-parse HEAD) \
  --build-arg BUILD_VERSION=dev \
  -t ghcr.io/ganesh47/sqlite-meta-api:dev .

docker run --rm -p 8080:8080 \
  -e SQLITE_PATH=/data/metadata.sqlite \
  -v $(pwd)/data:/data \
  ghcr.io/ganesh47/sqlite-meta-api:dev

# Push + sign (requires GHCR_PAT and cosign keyless or envs set)
docker push ghcr.io/ganesh47/sqlite-meta-api:dev
cosign sign ghcr.io/ganesh47/sqlite-meta-api:dev
```

The build stage uses `pnpm deploy` to publish the compiled Fastify service plus production dependencies into `/opt/app`, and the runtime stage executes `node dist/index.js` on Node.js 20 LTS. Use the optional `--ignorefile docker/api/.dockerignore` flag so Docker avoids sending the entire repository as context.
If your Docker version does not support `--ignorefile`, omit the flag—the image still builds correctly.

## CLI Image (`docker/cli/Dockerfile`)

```bash
docker build \
  -f docker/cli/Dockerfile \
  --ignorefile docker/cli/.dockerignore \
  --build-arg BUILD_SHA=$(git rev-parse HEAD) \
  --build-arg BUILD_VERSION=dev \
  -t ghcr.io/ganesh47/sqlite-meta-cli:dev .

docker run --rm \
  -v $(pwd)/data:/data \
  ghcr.io/ganesh47/sqlite-meta-cli:dev --help

# Push + sign (requires GHCR_PAT and cosign keyless or envs set)
docker push ghcr.io/ganesh47/sqlite-meta-cli:dev
cosign sign ghcr.io/ganesh47/sqlite-meta-cli:dev
```

## Connector Image (`docker/connector/Dockerfile`)

```bash
docker build -f docker/connector/Dockerfile -t ghcr.io/ganesh47/sqlite-meta-connector-http:dev .
docker run --rm ghcr.io/ganesh47/sqlite-meta-connector-http:dev --help
```

## Compose Stack

`docker/api/compose.yml` wires the API container, SQLite volume, and supporting services for local smoke tests:

```bash
docker compose -f docker/api/compose.yml up -d
curl http://localhost:8080/health/ready
```

## Supply-Chain Requirements

All published images **must**:

- embed SBOM data generated with `syft` (attach via `oras` or `cosign attest`),
- be signed with `cosign sign ghcr.io/...`,
- include provenance for the Git SHA in CI logs.

Refer to `specs/001-plan-alignment/quickstart.md` for the end-to-end workflow (build → test → sign → push) and ensure the README stays updated as new targets are added.

### Helper script

Use `scripts/publish-images.sh` to build, push, generate SBOMs, and sign the API/CLI/connector images in one step (requires `cosign` and access to GHCR):

```bash
REGISTRY=ghcr.io GHCR_USERNAME=ganesh47 VERSION=dev scripts/publish-images.sh
```
