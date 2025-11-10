import { beforeAll, afterAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildServer } from "../src/server";
import type { HealthPayload } from "../src/routes/health";

describe("GET /health/ready", () => {
  let app: FastifyInstance;
  const sqlitePath = join(mkdtempSync(join(tmpdir(), "metadata-health-")), "db.sqlite");

  beforeAll(async () => {
    app = await buildServer({ sqlitePath });
    await app.ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("returns readiness payload that matches the contract", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health/ready",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as HealthPayload;
    expect(body.status).toBe("ready");
    expect(typeof body.version).toBe("string");
    expect(body.sqlite).toMatchObject({
      wal_checkpointed: true,
      migrations: "applied",
    });
  });
});
