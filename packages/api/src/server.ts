import Fastify from "fastify";
import cors from "@fastify/cors";
import pino from "pino";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { graphRoutes } from "./routes/graph.js";
import { healthRoutes } from "./routes/health.js";
import { GraphService } from "./services/graph-service.js";
import { applyMigrations } from "./utils/migrations.js";
import { metricsPlugin } from "./plugins/metrics.js";

export interface ServerOptions {
  sqlitePath?: string;
  loggerLevel?: string;
}

export const buildServer = async (options: ServerOptions = {}) => {
  const sqlitePath = resolveSqlitePath(options.sqlitePath);
  ensureDirectory(sqlitePath);

  const sqlite = new Database(sqlitePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  applyMigrations(sqlite);

  const db = drizzle(sqlite);
  const app = Fastify({
    logger: pino({ level: options.loggerLevel ?? process.env.LOG_LEVEL ?? "info" }),
  });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
  });

  await app.register(metricsPlugin, { sampleSize: 200 });

  const graphService = new GraphService(db);
  await app.register(graphRoutes, { graphService });
  await app.register(healthRoutes, { sqlite });

  app.addHook("onClose", (_, done) => {
    sqlite.close();
    done();
  });

  return app;
};

const resolveSqlitePath = (configuredPath?: string) => {
  if (configuredPath) {
    return configuredPath;
  }

  const envPath = process.env.SQLITE_PATH;
  if (envPath) {
    return envPath;
  }

  return resolve(process.cwd(), "data/metadata.sqlite");
};

const ensureDirectory = (filePath: string) => {
  mkdirSync(dirname(filePath), { recursive: true });
};
