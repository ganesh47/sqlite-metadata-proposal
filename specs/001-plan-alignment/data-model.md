# Data Model – Polyglot Deployment Stack Alignment

## GraphNode
| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `id` | TEXT | API/CLI | UUIDv7 per org, primary key with `org_id` |
| `org_id` | TEXT | API auth context | Partition key tying nodes to tenants |
| `type` | TEXT | API payload | Enumerated types defined in proposal §4 |
| `properties` | JSON | API/CLI | Validated JSON object; CLI enforces schema |
| `created_at` | DATETIME | DB trigger | Default `CURRENT_TIMESTAMP` |
| `updated_at` | DATETIME | DB trigger | Bumped by trigger on UPDATE |
| `created_by` | TEXT | API | Actor id from auth claims/API key |
| `updated_by` | TEXT | API | Last modifier |
| `user_agent` | TEXT | API/CLI | Optional instrumentation for UX parity |
| `client_ip` | TEXT | API | Populated when available |

**Relationships**: `GraphNode.id` referenced by `GraphEdge.source_id`/`target_id`. Nodes are soft-deleted via tombstone property to keep history.

## GraphEdge
| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `id` | TEXT | API/CLI | UUIDv7 per edge |
| `org_id` | TEXT | API | Matches node partition |
| `source_id` | TEXT | API/CLI | FK → `graph_nodes(id, org_id)` |
| `target_id` | TEXT | API/CLI | FK → `graph_nodes(id, org_id)` |
| `type` | TEXT | API | Enum typed per proposal |
| `properties` | JSON | API/CLI | Relationship metadata |
| `created_at` | DATETIME | DB trigger | default now |
| `updated_at` | DATETIME | DB trigger | default now/update |
| `created_by` | TEXT | API | actor id |
| `updated_by` | TEXT | API | actor id |

**State Transitions**: `pending` (ingest), `committed` (default), `superseded` (when CLI/connector replaces) tracked via `properties.state`.

## MigrationJob
| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `job_id` | TEXT | CLI/Connector | ULID identifying ingestion/migration |
| `source` | TEXT | CLI/Connector | e.g., `youtube8m`, `custom-http` |
| `status` | TEXT | CLI/API | Enum: `queued`, `running`, `succeeded`, `failed` |
| `started_at` | DATETIME | CLI | job start |
| `completed_at` | DATETIME | CLI | job end |
| `metrics` | JSON | CLI/API | includes counts, throughput, error rate |
| `image_digest` | TEXT | CI | Docker image digest executed |
| `logs_url` | TEXT | CLI | pointer to log archive |

**Relationships**: Jobs link to nodes/edges through audit metadata (`job_id` column in node/edge tables) for traceability.

## ConnectorConfig
| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `connector_id` | TEXT | API | Unique id for Java connector deployment |
| `org_id` | TEXT | API | owner org |
| `name` | TEXT | API | descriptor |
| `type` | TEXT | API | `http`, `kafka`, etc. |
| `config` | JSON | API | encrypted settings (API key, topics) |
| `status` | TEXT | API | `active`, `paused`, `error` |
| `last_heartbeat` | DATETIME | Connector | from Micrometer probe |

**State Machine**:
1. `draft` → `active` when validated & saved.
2. `active` → `paused` via operator or health failure.
3. `paused` → `active` after resolution.
4. `active` → `error` when heartbeat exceeds SLA; triggers alert + CLI remediation task.
