import type { FastifyPluginOptions, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

interface Sample {
  route: string;
  durationMs: number;
  rssMb: number;
}

export interface MetricsSnapshot {
  count: number;
  p95DurationMs: number;
  rssMb: number;
}

export class MetricsCollector {
  private readonly samples: Sample[] = [];

  constructor(private readonly maxSamples = 100) {}

  observe(sample: Sample) {
    this.samples.push(sample);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  snapshot(route?: string): MetricsSnapshot {
    const filtered = route ? this.samples.filter((sample) => sample.route === route) : this.samples;
    if (filtered.length === 0) {
      return { count: 0, p95DurationMs: 0, rssMb: 0 };
    }

    const sorted = [...filtered].sort((a, b) => a.durationMs - b.durationMs);
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
    const p95DurationMs = sorted[idx]?.durationMs ?? 0;
    const rssMb = filtered[filtered.length - 1]?.rssMb ?? 0;
    return { count: filtered.length, p95DurationMs, rssMb };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    metrics: MetricsCollector;
  }

  interface FastifyRequest {
    _metrics?: {
      startedAt: bigint;
      route: string;
    };
  }
}

export interface MetricsPluginOptions extends FastifyPluginOptions {
  sampleSize?: number;
}

export const metricsPlugin = fp<MetricsPluginOptions>(async (fastify, opts) => {
  const collector = new MetricsCollector(opts.sampleSize);
  fastify.decorate("metrics", collector);

  fastify.addHook("onRequest", (request, _reply, done) => {
    request._metrics = {
      startedAt: process.hrtime.bigint(),
      route: resolveRoute(request),
    };
    done();
  });

  fastify.addHook("onResponse", (request, _reply, done) => {
    const startedAt = request._metrics?.startedAt;
    const route = request._metrics?.route ?? request.url;

    if (startedAt && route) {
      const elapsed = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const rssMb = process.memoryUsage().rss / (1024 * 1024);
      collector.observe({
        route,
        durationMs: elapsed,
        rssMb,
      });

      if (elapsed > 200 || rssMb > 256) {
        fastify.log.warn({ route, durationMs: elapsed, rssMb }, "Performance budget exceeded");
      }
    }

    done();
  });
});

function resolveRoute(request: FastifyRequest) {
  return request.routeOptions?.url ?? request.url;
}
