import { beforeAll, afterAll } from "vitest";

beforeAll(() => {
  process.env.SQLITE_PATH = process.env.SQLITE_PATH ?? ".vitest/metadata.sqlite";
});

afterAll(() => {
  // Placeholder for cleaning up resources once Fastify app is added.
});
