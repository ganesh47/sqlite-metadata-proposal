import { defineConfig } from "vitest/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const configDir = dirname(fileURLToPath(import.meta.url));
const setupFile = resolve(configDir, "tests/setup.ts");

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: [setupFile],
    globals: true,
    testTimeout: 10_000,
    hookTimeout: 10_000,
    maxThreads: 4,
    minThreads: 1,
    watchExclude: ["dist/**", "docker/**", "packages/cli/**", "packages/connectors/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      lines: 80,
      functions: 80,
      branches: 70,
      watermarks: {
        statements: [80, 90],
        branches: [70, 85],
        functions: [80, 90],
        lines: [80, 90]
      }
    },
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
        isolate: false
      }
    }
  }
});
