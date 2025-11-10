import type Database from "better-sqlite3";
import type { FastifyPluginAsync } from "fastify";

export interface SqliteHealth {
  wal_checkpointed: boolean;
  migrations: string;
}

export interface HealthPayload {
  status: "ready";
  version: string;
  sqlite: SqliteHealth;
}

export interface HealthRouteOptions {
  sqlite: Database;
}

export const healthRoutes: FastifyPluginAsync<HealthRouteOptions> = async (fastify, opts) => {
  fastify.get("/health/ready", async (request, reply) => {
    const payload = buildHealthPayload(opts.sqlite);

    if (!payload.sqlite.wal_checkpointed || payload.sqlite.migrations !== "applied") {
      return reply.status(503).send(payload);
    }

    return reply.status(200).send(payload);
  });
};

const getVersion = () => process.env.npm_package_version ?? "0.0.0-dev";

export const buildHealthPayload = (sqlite: Database): HealthPayload => ({
  status: "ready",
  version: getVersion(),
  sqlite: {
    wal_checkpointed: ensureWalCheckpoint(sqlite),
    migrations: verifyMigrations(sqlite),
  },
});

const ensureWalCheckpoint = (sqlite: Database): boolean => {
  const journalMode = sqlite.pragma("journal_mode", { simple: true });
  return typeof journalMode === "string" && journalMode.toLowerCase() === "wal";
};

const verifyMigrations = (sqlite: Database): string => {
  const requiredTables = ["graph_nodes", "graph_edges", "migration_jobs", "connector_configs"];
  const missing = requiredTables.filter((table) => !tableExists(sqlite, table));
  return missing.length === 0 ? "applied" : `missing:${missing.join(",")}`;
};

const tableExists = (sqlite: Database, table: string): boolean => {
  const row = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1")
    .get(table);
  return Boolean(row);
};
