import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
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

export interface StartServerOptions extends ServerOptions {
  host?: string;
  port?: number;
  signals?: NodeJS.Signals[];
  exitOnShutdown?: boolean;
  listenFactory?: (app: FastifyInstance, opts: { port: number; host: string }) => Promise<void>;
  signalBinder?: (signal: NodeJS.Signals, handler: () => void) => void;
  signalUnbinder?: (signal: NodeJS.Signals, handler: () => void) => void;
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

export const startServer = async (options: StartServerOptions = {}): Promise<FastifyInstance> => {
  const app = await buildServer(options);
  const port = options.port ?? Number(process.env.API_PORT ?? 8080);
  const host = options.host ?? process.env.API_HOST ?? "0.0.0.0";
  const signals = options.signals ?? ["SIGINT", "SIGTERM"];
  const exitOnShutdown = options.exitOnShutdown ?? true;
  const listenFactory =
    options.listenFactory ??
    ((instance: FastifyInstance, listenOpts: { port: number; host: string }) =>
      instance.listen(listenOpts));
  const bindSignal =
    options.signalBinder ??
    ((signal: NodeJS.Signals, handler: () => void) => process.once(signal, handler));
  const unbindSignal =
    options.signalUnbinder ??
    ((signal: NodeJS.Signals, handler: () => void) => process.removeListener(signal, handler));

  const handlers: Array<{ signal: NodeJS.Signals; handler: () => void }> = [];

  const shutdown = async (signal: NodeJS.Signals) => {
    app.log.info({ signal }, "Shutting down API server");
    try {
      await app.close();
      if (exitOnShutdown) {
        process.exit(0);
      }
    } catch (error) {
      app.log.error(error);
      if (exitOnShutdown) {
        process.exit(1);
      }
    }
  };

  signals.forEach((signal) => {
    const handler = () => void shutdown(signal);
    handlers.push({ signal, handler });
    bindSignal(signal, handler);
  });

  app.addHook("onClose", (_instance, done) => {
    handlers.forEach(({ signal, handler }) => unbindSignal(signal, handler));
    done();
  });

  try {
    await listenFactory(app, { port, host });
    app.log.info({ host, port }, "SQLite Metadata API ready");
  } catch (error) {
    app.log.error(error);
    throw error;
  }

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
