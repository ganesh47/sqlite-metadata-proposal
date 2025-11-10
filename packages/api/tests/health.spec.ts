import { beforeAll, afterAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../src/server";
import type { HealthPayload } from "../src/routes/health";

describe("GET /health/ready", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ sqlitePath: process.env.SQLITE_PATH });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
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
