import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { beforeAll, afterAll, beforeEach } from "vitest";

const ensureDbPath = () => {
  const dbPath = process.env.SQLITE_PATH ?? ".vitest/metadata.sqlite";
  const absolute = resolve(dbPath);
  mkdirSync(dirname(absolute), { recursive: true });
  process.env.SQLITE_PATH = absolute;
};

beforeAll(() => {
  ensureDbPath();
  process.env.API_PORT = process.env.API_PORT ?? "8080";
});

beforeEach(() => {
  // Reset per-test timing budget markers if future hooks require them.
  process.env.__TEST_STARTED_AT = Date.now().toString();
});

afterAll(() => {
  delete process.env.__TEST_STARTED_AT;
});
