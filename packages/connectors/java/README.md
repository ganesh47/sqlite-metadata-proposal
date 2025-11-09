# Java Connectors (Spring Boot + Maven)

This module will host the Maven multi-module workspace for JVM-based connectors that push metadata into the API.

## Planned Modules
- `core-client`: Generated OpenAPI client + shared DTOs
- `connector-template`: Spring Boot starter with batching, retries, and heartbeat publishing
- `examples/http-forwarder`: Reference connector streaming HTTP events into the API

## Responsibilities
- Enforce Java 21 LTS baseline with Spotless/Checkstyle
- Surface Micrometer metrics and `/connectors/{connectorId}/heartbeat` calls to satisfy Principle IV
- Produce Docker images from `docker/connector/Dockerfile`

See US3 tasks in `specs/001-plan-alignment/tasks.md` for detailed implementation steps.
