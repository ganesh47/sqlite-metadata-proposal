# Proposal: Cloud-Agnostic Metadata Graph Platform on SQLite

## 1. Executive Summary

- **Objective**: Reimagine the current Cloudflare-centric metadata system as a
  portable, open-source platform that runs on any infrastructure (VM, container,
  desktop) with SQLite as the primary storage engine.
- **Motivation**: Preserve the strengths of the existing
  implementation—graph-first modeling, audit trails, and RAG readiness—while
  eliminating the dependency on
  Cloudflare Workers/KV/R2, and unlocking offline, edge, or self-hosted
  deployments.
- **Outcome**: Deliver a drop-in replacement API, web console, and tooling stack
  that teams can self-host, embed into products, or extend with custom plugins.

## 2. Key Learnings from the Current System

- **Worker-based API**: Cost-efficient but tightly coupled to Cloudflare
  bindings (KV, D1, R2, Qdrant).
  - **Impact**: Reimagine storage, caching, and vector search with open-source
    equivalents and clean abstractions.
- **Telemetry and auth guards**: Request-level patterns proved effective.
  - **Impact**: Preserve the middleware structure with adapters for popular
    frameworks (Express, Fastify, gRPC, etc.).
- **Embedding workflow**: The Together AI → Qdrant pipeline is powerful but
  optional.
  - **Impact**: Provide a pluggable embedding and vector search layer; default
    to local SQLite FTS while allowing remote stores via configuration.
- **CI pipeline**: Integrates performance load tests and schema enforcement.
  - **Impact**: Reuse the automated testing approach; integrate SQLite
    migrations, seed data, and smoke tests.
- **Front-end expectations**: Requires `{ data, pagination }` responses and
  OIDC-backed session cookies.
  - **Impact**: Keep API contracts stable and add configuration for local
    identity providers or API keys.

## 3. Vision & Design Principles

1. **Cloud-agnostic** – Run on laptops, private data centers, or cloud VMs using
   standard runtimes (Node.js, Bun, Deno, Go, Rust).
2. **SQLite-centric** – Use SQLite (with JSON1, FTS5, and R*Tree extensions
   where available) for nodes, edges, embeddings, and audit logs.
3. **Pluggable & modular** – Maintain clear boundaries between storage, auth,
   API, and analytics so teams can swap components without rewriting core logic.
4. **Graph-native semantics** – Preserve directed edges, properties, and
   traversal semantics honed in the Cloudflare version.
5. **Developer-friendly** – Ship a single binary or Docker image with sensible
   defaults; offer an optional dev server featuring hot reload.
6. **RAG-ready** – Offer local embedding and vector search options (e.g.,
   `sqlite-vss`, `pgvector` shim) while supporting remote providers through
   adapters.

## 4. High-Level Architecture

```text
┌──────────────────┐
│   Client Apps     │  (Next.js console, CLI, integrations)
└────────┬─────────┘
         │ HTTP/gRPC/WebSocket
┌────────▼─────────┐      ┌─────────────────────┐
│  API Gateway      │◄────►│  Auth Provider (OIDC│ (Keycloak, Auth0, API keys)
│  (Fastify/Express)│      │  , JWT, API Keys)   │
└────────┬─────────┘      └─────────────────────┘
         │
┌────────▼─────────────┐
│  Domain Services      │  (Nodes, Edges, Traversal, Metadata Import/Export)
│  - CQRS-style handlers│
│  - Validation         │
│  - Event emitters     │
└────────┬─────────────┘
         │
┌────────▼─────────────┐
│ SQLite Persistence    │
│ - graph_nodes table   │
│ - graph_edges table   │
│ - node_properties JSON│
│ - edge_properties JSON│
│ - CTEs for traversal  │
│ - FTS5, VSS, Triggers │
└────────┬─────────────┘
         │
┌────────▼─────────────┐
│ Optional Extensions   │
│ - Vector search (sqlite-vss, Qdrant adapter) │
│ - Audit/Event sink (Kafka, NATS, local file) │
│ - Analytics (DuckDB integration)             │
└──────────────────────┘
```

### Core Modules

1. **API Server**
   - Use Fastify (Node.js) or Axum (Rust) for performance and a rich plugin
     ecosystem.
   - Bundle the OpenAPI spec with automatic documentation.
   - Implement the same routes as the current worker (`/:orgId/nodes`,
     `/:orgId/edges`, `/orgs`, `/:orgId/metadata/export`, etc.).
   - Maintain a middleware chain: logging → CORS → rate limiting → auth →
     route handler.

2. **Storage Layer**
   - SQLite database file with migrations managed by Prisma, Kysely, or Drizzle
     (if Node) or SQLx (Rust).
   - Schema mirroring D1 tables:

     ```sql
     CREATE TABLE graph_nodes (
       id TEXT NOT NULL,
       org_id TEXT NOT NULL,
       type TEXT NOT NULL,
       properties JSON NOT NULL DEFAULT '{}',
       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
       created_by TEXT NOT NULL,
       updated_by TEXT NOT NULL,
       user_agent TEXT,
       client_ip TEXT,
       PRIMARY KEY (id, org_id)
     );
     CREATE INDEX idx_nodes_org_type ON graph_nodes(org_id, type);
     ```

   - Edges table with foreign-key enforcement.
   - Triggers to keep `updated_at` current.

3. **Traversal & Query Engine**
   - Re-implement traversals using recursive CTEs in SQLite.
   - Provide streaming iterators for large graphs.
   - Offer a pluggable in-memory cache (LRU) for hot nodes (optional, default
     off).

4. **Embedding & Search**
   - Default: use SQLite JSON/FTS for text search.
   - Optional: integrate the `sqlite-vss` extension or an external vector DB
     (Qdrant, Weaviate) via an adapter.
   - Provide a background worker process for embedding generation (OpenAI or
     local transformers).

5. **Import/Export + Backup**
   - JSON-based import/export CLI using SQLite transactions.
   - Snapshot command to dump the `.sqlite` file or emit `.sql`.
   - Supply migration from Cloudflare D1 (SQL export) to SQLite using an ETL
     script.

6. **Observability**
   - Structured logging (pino or bunyan) with log-level control.
   - Health checks (`/health/live`, `/health/ready`).
   - Optional Prometheus metrics endpoint.

## 5. Front-End & Tooling

1. **Web Console**
   - Reuse the existing Next.js UI, replacing Cloudflare fetch URLs with a
     configurable base URL.
   - Authenticate via the same OIDC provider or a local API key (fallback for
     demos).
   - Extend the UI with graph visualization (D3 or React Flow), node/edge
     editors, and a traversal explorer.

2. **CLI Tool**
   - Provide `metadata-cli` for:
     - Bootstrapping database (`metadata-cli init`).
     - Import/export (`metadata-cli export --org org1`).
     - Running migrations.
     - Launching API server (developer experience).

3. **SDKs**
   - TypeScript client library generated from OpenAPI.
   - Python client for ingestion scripts.

## 6. Deployment & Operations

- **Local development**: `docker compose up` with the API server and SQLite
  volume; enable autoreload options for quick feedback.
- **Self-hosted VM**: Run as a Systemd service or Docker container; mount a
  persistent volume for the `.sqlite` database file.
- **Cloud**: Works on any provider (AWS EC2, GCP Compute Engine, Fly.io);
  optionally layer on managed SQLite services (LiteFS, Turso, PlanetScale
  serverless driver).
- **Scaling**: Use horizontal read replicas with Litestream or LiteFS; provide a
  migration path to Postgres for heavier workloads while keeping the same API.

### Reliability

- Automatic WAL checkpointing and backup via Litestream or LiteFS.
- Transactional migrations with version table.
- Configurable rate limits and request quotas per org (Redis or in-process
  token bucket).

## 7. Security & Auth Strategy

- **Auth modes** (pluggable):
  1. OIDC/JWT (Keycloak, Auth0, Azure AD).
  2. API keys per org (for service-to-service usage).
  3. mTLS (optional for enterprise).
- RBAC scope model identical to the current system (`<orgId>:read`,
  `<orgId>:write`, wildcard).
- Audit logs stored in the `audit_events` table (action, actor, timestamp,
  payload).
- Sensitive logging stripped (no token dumps).

## 8. Migration Path from Cloudflare Version

1. **Export** data from D1 using Wrangler or the `cf-graphdb-api` export
   endpoint per org.
2. **Transform** exports (if necessary) to align with the new schema using an
   ETL script.
3. **Import** into SQLite using `metadata-cli import`.
4. **Redirect** the front-end `.env` to the new API URL.
5. **Replace** Cloudflare-specific env vars with the new config file
   (`config/default.yaml`).

## 9. Delivery Plan & Milestones

- **Phase 0 – Discovery (1 week)**: Finalize detailed requirements and select
  the tech stack (Node/Fastify with Drizzle recommended).
- **Phase 1 – Foundations (2 weeks)**: Build the SQLite schema, migration
  tooling, API skeleton with auth middleware, and CI pipeline.
- **Phase 2 – Core Features (3 weeks)**: Implement node and edge CRUD,
  traversal/query flows, import/export features, and the CLI bootstrap.
- **Phase 3 – Vector + Search (2 weeks)**: Integrate FTS, add an optional vector
  adapter, and ship the background embedding worker.
- **Phase 4 – Front-end Integration (2 weeks)**: Update the Next.js console,
  wire up OIDC/Auth, and deliver UX improvements.
- **Phase 5 – Hardening (2 weeks)**: Run performance tests (k6 or Locust),
  complete the security review, polish docs, and prepare packaging (Docker,
  binary).
- **Phase 6 – Migration & Launch (1 week)**: Provide D1 → SQLite migration
  scripts and publish the GA announcement.

## 10. Risks & Mitigations

- **SQLite at scale**: Single-writer limitation; mitigate with WAL mode, a job
  queue for heavy writes, and a planned migration path to Postgres when needed.
- **Embedding performance**: Running local embeddings can be resource-intensive;
  allow asynchronous pipelines and support remote providers.
- **Auth complexity**: Provide templates for OIDC and API key flows; include
  integration tests.
- **Data consistency**: Without KV, rely on SQLite and optional in-memory
  caches; ensure delete/update handlers invalidate caches correctly.

## 11. Success Metrics

- Time-to-first-setup under 10 minutes (from `git clone` to a running API with
  sample data).
- Import/export parity with the existing Cloudflare version.
- Sustained throughput of 100 RPS read and 20 RPS write on a mid-tier VM
  without errors.
- Traversal latency (depth = 3, graph = 5k nodes) under 300 ms median.
- 80% test coverage across the API, storage, and CLI.

## 12. Next Steps

1. Approve the scope and target stack (Fastify + TypeScript + Drizzle
   recommended).
2. Set up the repository scaffold (`packages/api`, `packages/cli`, `apps/web`).
3. Author the migration tool for current datasets (YouTube8M ingestion to
   SQLite).
4. Begin Phase 1 implementation with iterative demos every sprint.

Prepared as a forward-looking plan that leverages lessons from the Cloudflare
implementation while enabling a broader deployment footprint.
