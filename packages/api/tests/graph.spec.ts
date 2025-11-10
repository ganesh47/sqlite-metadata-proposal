import request from "supertest";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../src/server";

const createNodes = async (app: FastifyInstance) => {
  const payload = {
    items: [
      {
        id: "node-1",
        type: "workspace",
        properties: {},
      },
      {
        id: "node-2",
        type: "workspace",
        properties: {},
      },
    ],
  };

  await request(app.server)
    .post("/orgs/demo-org/nodes")
    .send(payload)
    .set("content-type", "application/json");
};

describe("graph contract", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ sqlitePath: process.env.SQLITE_PATH });
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
    await createNodes(app);

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
