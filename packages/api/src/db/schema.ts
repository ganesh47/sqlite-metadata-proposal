import { integer, sqliteTable, text, primaryKey, numeric } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const graphNodes = sqliteTable(
  "graph_nodes",
  {
    id: text("id").notNull(),
    orgId: text("org_id").notNull(),
    type: text("type").notNull(),
    properties: text("properties", { length: 65535 }).notNull().default("{}"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by").notNull(),
    userAgent: text("user_agent"),
    clientIp: text("client_ip"),
    jobId: text("job_id"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.orgId, table.id] }),
  })
);

export const graphEdges = sqliteTable(
  "graph_edges",
  {
    id: text("id").notNull(),
    orgId: text("org_id").notNull(),
    sourceId: text("source_id").notNull(),
    targetId: text("target_id").notNull(),
    type: text("type").notNull(),
    properties: text("properties", { length: 65535 }).notNull().default("{}"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by").notNull(),
    jobId: text("job_id"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.orgId, table.id] }),
  })
);

export const migrationJobs = sqliteTable(
  "migration_jobs",
  {
    jobId: text("job_id").notNull().primaryKey(),
    orgId: text("org_id").notNull(),
    source: text("source").notNull(),
    status: text("status").notNull(),
    startedAt: integer("started_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    metrics: text("metrics", { length: 65535 }).default("{}"),
    imageDigest: text("image_digest"),
    logsUrl: text("logs_url"),
  }
);

export const connectorConfigs = sqliteTable(
  "connector_configs",
  {
    connectorId: text("connector_id").notNull(),
    orgId: text("org_id").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    config: text("config", { length: 65535 }).notNull().default("{}"),
    status: text("status").notNull().default("draft"),
    lastHeartbeat: integer("last_heartbeat", { mode: "timestamp" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.orgId, table.connectorId] }),
  })
);
