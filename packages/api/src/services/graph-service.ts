import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";
import { graphNodes, graphEdges } from "../db/schema";

export interface MutationContext {
  jobId?: string;
  userAgent?: string;
  clientIp?: string;
}

export interface NodeInput {
  id: string;
  type: string;
  properties: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
}

export interface EdgeInput {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  properties: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
}

export interface BulkError {
  error: string;
  code: string;
  details: string[];
}

export interface BulkAcknowledge {
  accepted: number;
  rejected: number;
  errors: BulkError[];
}

export class GraphService {
  constructor(private readonly db: BetterSQLite3Database) {}

  async upsertNodes(orgId: string, items: NodeInput[], ctx: MutationContext): Promise<BulkAcknowledge> {
    const result = this.processItems(items, ctx, (item) => {
      const payload = serializeNode(orgId, item, ctx);
      this.db
        .insert(graphNodes)
        .values(payload)
        .onConflictDoUpdate({
          target: [graphNodes.orgId, graphNodes.id],
          set: {
            type: payload.type,
            properties: payload.properties,
            updatedAt: sql`CURRENT_TIMESTAMP`,
            updatedBy: payload.updatedBy,
            userAgent: payload.userAgent,
            clientIp: payload.clientIp,
            jobId: payload.jobId,
          },
        })
        .run();
    });

    return result;
  }

  async upsertEdges(orgId: string, items: EdgeInput[], ctx: MutationContext): Promise<BulkAcknowledge> {
    const result = this.processItems(items, ctx, (item) => {
      const payload = serializeEdge(orgId, item, ctx);
      this.db
        .insert(graphEdges)
        .values(payload)
        .onConflictDoUpdate({
          target: [graphEdges.orgId, graphEdges.id],
          set: {
            sourceId: payload.sourceId,
            targetId: payload.targetId,
            type: payload.type,
            properties: payload.properties,
            updatedAt: sql`CURRENT_TIMESTAMP`,
            updatedBy: payload.updatedBy,
            jobId: payload.jobId,
          },
        })
        .run();
    });

    return result;
  }

  private processItems<T>(
    items: T[],
    ctx: MutationContext,
    handler: (item: T) => void
  ): BulkAcknowledge {
    const errors: BulkError[] = [];
    let accepted = 0;

    for (const item of items) {
      try {
        handler(item);
        accepted += 1;
      } catch (error) {
        errors.push({
          error: "UpsertFailed",
          code: "UPSERT_FAILURE",
          details: [error instanceof Error ? error.message : "Unknown error"],
        });
      }
    }

    return {
      accepted,
      rejected: errors.length,
      errors,
    };
  }
}

const fallbackActor = "system";

const serializeNode = (orgId: string, node: NodeInput, ctx: MutationContext) => ({
  id: node.id,
  orgId,
  type: node.type,
  properties: JSON.stringify(node.properties ?? {}),
  createdBy: node.createdBy ?? fallbackActor,
  updatedBy: node.updatedBy ?? node.createdBy ?? fallbackActor,
  userAgent: ctx.userAgent,
  clientIp: ctx.clientIp,
  jobId: ctx.jobId ?? null,
});

const serializeEdge = (orgId: string, edge: EdgeInput, ctx: MutationContext) => ({
  id: edge.id,
  orgId,
  sourceId: edge.sourceId,
  targetId: edge.targetId,
  type: edge.type,
  properties: JSON.stringify(edge.properties ?? {}),
  createdBy: edge.createdBy ?? fallbackActor,
  updatedBy: edge.updatedBy ?? edge.createdBy ?? fallbackActor,
  jobId: ctx.jobId ?? null,
});
