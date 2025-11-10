import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { GraphService } from "../services/graph-service";

const nodePayloadSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  properties: z.record(z.any()).default({}),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

const edgePayloadSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  type: z.string().min(1),
  properties: z.record(z.any()).default({}),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

const nodeUpsertSchema = z.object({
  jobId: z.string().optional(),
  items: z.array(nodePayloadSchema).min(1).max(1000),
});

const edgeUpsertSchema = z.object({
  jobId: z.string().optional(),
  items: z.array(edgePayloadSchema).min(1).max(1000),
});

const buildValidationError = (code: string, details: string[]) => ({
  error: "Bad Request",
  code,
  details,
});

export interface GraphRouteOptions {
  graphService: GraphService;
}

export const graphRoutes: FastifyPluginAsync<GraphRouteOptions> = async (fastify, opts) => {
  const { graphService } = opts;

  fastify.post<{ Params: { orgId: string } }>("/orgs/:orgId/nodes", async (request, reply) => {
    const validation = nodeUpsertSchema.safeParse(request.body ?? {});

    if (!validation.success) {
      return reply.status(400).send(
        buildValidationError(
          "INVALID_NODE_UPSERT",
          validation.error.issues.map((issue) => issue.message)
        )
      );
    }

    const ctx = buildContext(request.headers["user-agent"], request.ip, validation.data.jobId);
    const ack = await graphService.upsertNodes(request.params.orgId, validation.data.items, ctx);
    return reply.status(202).send(ack);
  });

  fastify.post<{ Params: { orgId: string } }>("/orgs/:orgId/edges", async (request, reply) => {
    const validation = edgeUpsertSchema.safeParse(request.body ?? {});

    if (!validation.success) {
      return reply.status(400).send(
        buildValidationError(
          "INVALID_EDGE_UPSERT",
          validation.error.issues.map((issue) => issue.message)
        )
      );
    }

    const ctx = buildContext(request.headers["user-agent"], request.ip, validation.data.jobId);
    const ack = await graphService.upsertEdges(request.params.orgId, validation.data.items, ctx);
    return reply.status(202).send(ack);
  });
};

const buildContext = (userAgent: string | undefined, clientIp: string, jobId?: string) => ({
  userAgent,
  clientIp,
  jobId,
});
