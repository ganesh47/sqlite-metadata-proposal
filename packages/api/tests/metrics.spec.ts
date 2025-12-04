import Fastify from "fastify";
import pino from "pino";
import { Writable } from "node:stream";
import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { MetricsCollector, metricsPlugin } from "../src/plugins/metrics";

describe("MetricsCollector", () => {
  it("builds histogram snapshots with percentile data", () => {
    const collector = new MetricsCollector(10);

    [
      { route: "/nodes", method: "POST", durationMs: 10, rssMb: 100 },
      { route: "/nodes", method: "POST", durationMs: 30, rssMb: 110 },
      { route: "/nodes", method: "POST", durationMs: 60, rssMb: 120 },
    ].forEach((sample) => collector.observe(sample));

    const snapshot = collector.snapshot("/nodes");

    expect(snapshot.count).toBe(3);
    expect(snapshot.p50DurationMs).toBe(30);
    expect(snapshot.p95DurationMs).toBe(60);
    expect(snapshot.maxDurationMs).toBe(60);
    expect(snapshot.rssMb).toBe(120);
    expect(snapshot.histogram["<=25"]).toBe(1);
    expect(snapshot.histogram["<=50"]).toBe(1);
    expect(snapshot.histogram["<=100"]).toBe(1);
  });
});

describe("metricsPlugin", () => {
  it("emits histogram logs on the configured interval", async () => {
    const logs: Array<Record<string, any>> = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        chunk
          .toString()
          .split("\n")
          .filter(Boolean)
          .forEach((line) => logs.push(JSON.parse(line)));
        callback();
      },
    });

    const logger = pino(
      {
        level: "info",
      },
      stream
    );

    const app = Fastify({ logger });
    await app.register(metricsPlugin, { histogramLogInterval: 1, sampleSize: 50 });

    app.get("/health", async () => ({ ok: true }));
    app.post("/health", async () => ({ ok: true }));

    await app.inject({ method: "GET", url: "/health" });
    await app.inject({ method: "POST", url: "/health" });
    await delay(10);

    const histogramLogs = logs.filter((entry) => entry.msg === "request histogram");
    expect(histogramLogs.length).toBeGreaterThan(0);
    expect(histogramLogs[0]).toMatchObject({
      histogram: {
        scope: expect.any(String),
        route: expect.any(String),
        count: expect.any(Number),
        histogram: expect.any(Object),
      },
    });

    await app.close();
  });

  it("logs initial and shutdown histograms even when interval is high", async () => {
    const logs: Array<Record<string, any>> = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        chunk
          .toString()
          .split("\n")
          .filter(Boolean)
          .forEach((line) => logs.push(JSON.parse(line)));
        callback();
      },
    });

    const app = Fastify({
      logger: pino(
        {
          level: "info",
        },
        stream
      ),
    });

    await app.register(metricsPlugin, { histogramLogInterval: 50, sampleSize: 10 });
    app.get("/health", async () => ({ ok: true }));

    await app.inject({ method: "GET", url: "/health" });
    await delay(10);

    const initialHistogram = logs.find(
      (entry) => entry.msg === "request histogram" && entry.histogram?.scope === "route"
    );
    expect(initialHistogram?.histogram).toMatchObject({
      scope: "route",
      route: "/health",
    });

    await app.close();

    const shutdownHistogram = logs.find(
      (entry) => entry.msg === "request histogram" && entry.histogram?.scope === "global"
    );
    expect(shutdownHistogram?.histogram).toMatchObject({
      scope: "global",
    });
  });
});
