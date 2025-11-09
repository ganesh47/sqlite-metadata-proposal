import Fastify from "fastify";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { buildHealthPayload } from "../src/routes/health";

describe("GET /health/ready", () => {
  const app = Fastify();

  beforeAll(async () => {
    app.get("/health/ready", async () => buildHealthPayload());
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns readiness payload that matches the contract", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health/ready"
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as ReturnType<typeof buildHealthPayload>;
    expect(body.status).toBe("ready");
    expect(typeof body.version).toBe("string");
    expect(body.sqlite).toMatchObject({
      walCheckpointed: expect.any(Boolean),
      migrations: expect.any(String)
    });
  });
});
