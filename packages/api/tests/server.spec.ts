import { describe, expect, it, vi } from "vitest";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { startServer } from "../src/server.js";

const createSqlitePath = (prefix: string) => join(mkdtempSync(join(tmpdir(), prefix)), "db.sqlite");

describe("startServer", () => {
  it("starts a Fastify instance with the provided options", async () => {
    const sqlitePath = createSqlitePath("metadata-start-");
    let started = false;
    const listenFactory = vi.fn(async (instance) => {
      await instance.ready();
      started = true;
    });
    const app = await startServer({
      sqlitePath,
      port: 0,
      host: "127.0.0.1",
      signals: [],
      exitOnShutdown: false,
      listenFactory,
    });

    expect(started).toBe(true);
    await app.close();
    expect(listenFactory).toHaveBeenCalled();
  });

  it("registers and cleans up signal handlers", async () => {
    const signal: NodeJS.Signals = "SIGUSR2";
    const initialCount = process.listenerCount(signal);
    const sqlitePath = createSqlitePath("metadata-signal-");

    let started = false;
    const listenFactory = vi.fn(async (instance) => {
      await instance.ready();
      started = true;
    });
    const handlers = new Map<NodeJS.Signals, () => void>();
    const app = await startServer({
      sqlitePath,
      port: 0,
      host: "127.0.0.1",
      signals: [signal],
      exitOnShutdown: false,
      listenFactory,
      signalBinder: (sig, handler) => {
        handlers.set(sig, handler);
        process.once(sig, handler);
      },
      signalUnbinder: (sig, handler) => {
        handlers.delete(sig);
        process.removeListener(sig, handler);
      },
    });

    const closeSpy = vi.spyOn(app, "close");
    expect(process.listenerCount(signal)).toBe(initialCount + 1);

    await handlers.get(signal)?.();
    await delay(10);

    expect(closeSpy).toHaveBeenCalled();
    expect(started).toBe(true);
    expect(process.listenerCount(signal)).toBe(initialCount);
    expect(listenFactory).toHaveBeenCalled();
  });
});
