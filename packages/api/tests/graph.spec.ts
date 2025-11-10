import { beforeAll, afterAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

  await app.inject({
    method: "POST",
    url: "/orgs/demo-org/nodes",
    payload,
    headers: {
      "content-type": "application/json",
    },
  });
};

describe("graph contract", () => {
  let app: FastifyInstance;
  const sqlitePath = join(mkdtempSync(join(tmpdir(), "metadata-graph-")), "db.sqlite");

  beforeAll(async () => {
    app = await buildServer({ sqlitePath });
    await app.ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
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

    const response = await app.inject({
      method: "POST",
      url: "/orgs/demo-org/nodes",
      payload,
      headers: {
        "content-type": "application/json",
      },
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toMatchObject({
      accepted: 1,
      rejected: 0,
      errors: []
    });
  });

  it("rejects node payloads without items", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/orgs/demo-org/nodes",
      payload: {},
      headers: {
        "content-type": "application/json",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("INVALID_NODE_UPSERT");
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

    const response = await app.inject({
      method: "POST",
      url: "/orgs/demo-org/edges",
      payload,
      headers: {
        "content-type": "application/json",
      },
    });

    expect(response.statusCode).toBe(202);
    expect(response.json().accepted).toBe(1);
  });

  it("rejects edge payloads without items", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/orgs/demo-org/edges",
      payload: {},
      headers: {
        "content-type": "application/json",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("INVALID_EDGE_UPSERT");
  });
});
