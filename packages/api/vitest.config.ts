import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
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
    }
  }
});
