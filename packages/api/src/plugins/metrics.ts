import type { FastifyPluginOptions, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

const READ_LATENCY_BUDGET_MS = 100;
const WRITE_LATENCY_BUDGET_MS = 200;
const RSS_BUDGET_MB = 256;
const HISTOGRAM_BUCKETS_MS = [25, 50, 100, 200, 500];

interface Sample {
  route: string;
  method: string;
  durationMs: number;
  rssMb: number;
}

type HistogramBuckets = Record<string, number>;

export interface MetricsSnapshot {
  count: number;
  p50DurationMs: number;
  p95DurationMs: number;
  maxDurationMs: number;
  rssMb: number;
  histogram: HistogramBuckets;
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
    const filtered = route
      ? this.samples.filter((sample) => sample.route === route)
      : [...this.samples];

    if (filtered.length === 0) {
      return {
        count: 0,
        p50DurationMs: 0,
        p95DurationMs: 0,
        maxDurationMs: 0,
        rssMb: 0,
        histogram: createEmptyHistogram(),
      };
    }

    const durations = filtered.map((sample) => sample.durationMs).sort((a, b) => a - b);
    const rssMb = Math.max(...filtered.map((sample) => sample.rssMb));

    return {
      count: filtered.length,
      p50DurationMs: percentile(durations, 0.5),
      p95DurationMs: percentile(durations, 0.95),
      maxDurationMs: durations[durations.length - 1] ?? 0,
      rssMb,
      histogram: buildHistogram(durations),
    };
  }
}

interface HistogramLogPayload {
  scope: "route" | "global";
  route?: string;
  method?: string;
  snapshot: MetricsSnapshot;
  budgets: {
    latencyMs: number;
    rssMb: number;
  };
}

declare module "fastify" {
  interface FastifyInstance {
    metrics: MetricsCollector;
  }

  interface FastifyRequest {
    _metrics?: {
      startedAt: bigint;
      route: string;
      method: string;
    };
  }
}

export interface MetricsPluginOptions extends FastifyPluginOptions {
  sampleSize?: number;
  histogramLogInterval?: number;
}

export const metricsPlugin = fp<MetricsPluginOptions>(async (fastify, opts) => {
  const histogramLogInterval = Math.max(1, opts.histogramLogInterval ?? 25);
  const collector = new MetricsCollector(opts.sampleSize);
  const routeCounters = new Map<string, number>();
  let totalSamples = 0;

  const metricsLogger = fastify.log.child(
    {},
    {
      serializers: {
        histogram: histogramSerializer,
      },
    }
  );

  fastify.decorate("metrics", collector);

  fastify.addHook("onRequest", (request, _reply, done) => {
    request._metrics = {
      startedAt: process.hrtime.bigint(),
      route: resolveRoute(request),
      method: request.method,
    };
    done();
  });

  fastify.addHook("onResponse", (request, _reply, done) => {
    const startedAt = request._metrics?.startedAt;
    const route = request._metrics?.route ?? request.url;
    const method = request._metrics?.method ?? request.method;

    if (startedAt && route) {
      const durationMs = getDurationMs(startedAt);
      const rssMb = getRssMb();

      collector.observe({
        route,
        method,
        durationMs,
        rssMb,
      });

      totalSamples += 1;

      const routeCount = (routeCounters.get(route) ?? 0) + 1;
      routeCounters.set(route, routeCount);

      const latencyBudget = method === "GET" ? READ_LATENCY_BUDGET_MS : WRITE_LATENCY_BUDGET_MS;

      if (durationMs > latencyBudget || rssMb > RSS_BUDGET_MB) {
        fastify.log.warn({ route, method, durationMs, rssMb }, "Performance budget exceeded");
      }

      const shouldLogRouteHistogram = shouldLogHistogram(routeCount, histogramLogInterval);
      const shouldLogGlobalHistogram = shouldLogHistogram(totalSamples, histogramLogInterval);

      if (shouldLogRouteHistogram) {
        metricsLogger.info(
          {
            histogram: {
              scope: "route",
              route,
              method,
              budgets: { latencyMs: latencyBudget, rssMb: RSS_BUDGET_MB },
              snapshot: collector.snapshot(route),
            },
          },
          "request histogram"
        );
      }

      if (shouldLogGlobalHistogram) {
        metricsLogger.info(
          {
            histogram: {
              scope: "global",
              budgets: { latencyMs: WRITE_LATENCY_BUDGET_MS, rssMb: RSS_BUDGET_MB },
              snapshot: collector.snapshot(),
            },
          },
          "request histogram"
        );
      }
    }

    done();
  });

  fastify.addHook("onClose", (_instance, done) => {
    if (totalSamples > 0) {
      metricsLogger.info(
        {
          histogram: {
            scope: "global",
            budgets: { latencyMs: WRITE_LATENCY_BUDGET_MS, rssMb: RSS_BUDGET_MB },
            snapshot: collector.snapshot(),
          },
        },
        "request histogram"
      );
    }

    routeCounters.clear();
    done();
  });
});

function resolveRoute(request: FastifyRequest) {
  return request.routeOptions?.url ?? request.url;
}

const roundMetric = (value: number) => Math.round(value * 100) / 100;

const histogramSerializer = (payload?: HistogramLogPayload) => {
  if (!payload) {
    return payload;
  }

  const snapshot = payload.snapshot;

  return {
    scope: payload.scope,
    route: payload.route,
    method: payload.method,
    budgets: payload.budgets,
    count: snapshot.count,
    p50DurationMs: roundMetric(snapshot.p50DurationMs),
    p95DurationMs: roundMetric(snapshot.p95DurationMs),
    maxDurationMs: roundMetric(snapshot.maxDurationMs),
    rssMb: roundMetric(snapshot.rssMb),
    histogram: snapshot.histogram,
  };
};

const getDurationMs = (startedAt: bigint) => Number(process.hrtime.bigint() - startedAt) / 1_000_000;

const getRssMb = () => process.memoryUsage().rss / (1024 * 1024);

const shouldLogHistogram = (count: number, interval: number) => count === 1 || count % interval === 0;

const percentile = (samples: number[], pct: number) => {
  if (samples.length === 0) {
    return 0;
  }

  const idx = Math.min(samples.length - 1, Math.floor(samples.length * pct));
  return samples[idx] ?? 0;
};

const createEmptyHistogram = () => {
  const histogram: HistogramBuckets = {};
  HISTOGRAM_BUCKETS_MS.forEach((bucket) => {
    histogram[`<=${bucket}`] = 0;
  });
  histogram[`>${HISTOGRAM_BUCKETS_MS[HISTOGRAM_BUCKETS_MS.length - 1]}`] = 0;
  return histogram;
};

const buildHistogram = (durations: number[]): HistogramBuckets => {
  const histogram = createEmptyHistogram();
  durations.forEach((duration) => {
    const bucket = HISTOGRAM_BUCKETS_MS.find((limit) => duration <= limit);
    if (bucket === undefined) {
      const key = `>${HISTOGRAM_BUCKETS_MS[HISTOGRAM_BUCKETS_MS.length - 1]}`;
      histogram[key] += 1;
      return;
    }

    histogram[`<=${bucket}`] += 1;
  });

  return histogram;
};
