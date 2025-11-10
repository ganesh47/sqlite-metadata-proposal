import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import type BetterSqlite3 from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { HealthPayload } from "../src/routes/health";
import { healthRoutes } from "../src/routes/health";
import { applyMigrations } from "../src/utils/migrations";

const migrationsDir = fileURLToPath(new URL("../migrations", import.meta.url));

describe("GET /health/ready", () => {
  let app: FastifyInstance;
  let sqlite: BetterSqlite3.Database;
  let tempDir = "";

  const setupApp = async () => {
    tempDir = mkdtempSync(join(tmpdir(), "metadata-health-"));
    const sqlitePath = join(tempDir, "db.sqlite");
    sqlite = new Database(sqlitePath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    applyMigrations(sqlite, migrationsDir);

    app = Fastify();
    await app.register(healthRoutes, { sqlite });
    await app.ready();
  };

  const teardownApp = async () => {
    if (app) {
      await app.close();
    }
    if (sqlite) {
      sqlite.close();
    }
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  };

  const getHealth = () =>
    app.inject({
      method: "GET",
      url: "/health/ready",
    });

  beforeEach(async () => {
    await setupApp();
  });

  afterEach(async () => {
    await teardownApp();
  });

  it("returns readiness payload that matches the contract", async () => {
    const response = await getHealth();

    expect(response.statusCode).toBe(200);
    const body = response.json() as HealthPayload;
    expect(body.status).toBe("ready");
    expect(typeof body.version).toBe("string");
    expect(body.sqlite).toMatchObject({
      wal_checkpointed: true,
      migrations: "applied",
    });
  });

  it("returns 503 when a required table is missing", async () => {
    sqlite.exec("DROP TABLE connector_configs");

    const response = await getHealth();
    expect(response.statusCode).toBe(503);
    const body = response.json() as HealthPayload;
    expect(body.sqlite.migrations).toContain("missing:connector_configs");
  });

  it("returns 503 when WAL checkpoint cannot complete", async () => {
    sqlite.pragma("journal_mode = DELETE");

    const response = await getHealth();
    expect(response.statusCode).toBe(503);
    const body = response.json() as HealthPayload;
    expect(body.sqlite.wal_checkpointed).toBe(false);
  });
});
