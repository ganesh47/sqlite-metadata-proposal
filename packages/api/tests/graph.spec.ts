import Fastify from "fastify";
import request from "supertest";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const buildGraphServer = () => {
  const app = Fastify();

  app.post("/orgs/:orgId/nodes", async (req, reply) => {
    const body = req.body as { items?: Array<Record<string, unknown>> };
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return reply.status(400).send({
        error: "Bad Request",
        code: "INVALID_NODE_UPSERT",
        details: ["items array required"]
      });
    }

    return reply.status(202).send({
      accepted: body.items.length,
      rejected: 0,
      errors: []
    });
  });

  app.post("/orgs/:orgId/edges", async (req, reply) => {
    const body = req.body as { items?: Array<Record<string, unknown>> };
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return reply.status(400).send({
        error: "Bad Request",
        code: "INVALID_EDGE_UPSERT",
        details: ["items array required"]
      });
    }

    return reply.status(202).send({
      accepted: body.items.length,
      rejected: 0,
      errors: []
    });
  });

  return app;
};

describe("graph contract", () => {
  const app = buildGraphServer();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("accepts valid node upserts", async () => {
    const payload = {
      items: [
        {
          id: "node-1",
          type: "workspace",
          properties: {}
        }
      ]
    };

    const response = await request(app.server)
      .post("/orgs/demo-org/nodes")
      .send(payload)
      .set("content-type", "application/json");

    expect(response.statusCode).toBe(202);
    expect(response.body).toMatchObject({
      accepted: 1,
      rejected: 0,
      errors: []
    });
  });

  it("rejects node payloads without items", async () => {
    const response = await request(app.server)
      .post("/orgs/demo-org/nodes")
      .send({})
      .set("content-type", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.code).toBe("INVALID_NODE_UPSERT");
  });

  it("accepts valid edge upserts", async () => {
    const payload = {
      items: [
        {
          id: "edge-1",
          sourceId: "node-1",
          targetId: "node-2",
          type: "link",
          properties: {}
        }
      ]
    };

    const response = await request(app.server)
      .post("/orgs/demo-org/edges")
      .send(payload)
      .set("content-type", "application/json");

    expect(response.statusCode).toBe(202);
    expect(response.body.accepted).toBe(1);
  });

  it("rejects edge payloads without items", async () => {
    const response = await request(app.server)
      .post("/orgs/demo-org/edges")
      .send({})
      .set("content-type", "application/json");

    expect(response.statusCode).toBe(400);
    expect(response.body.code).toBe("INVALID_EDGE_UPSERT");
  });
});
