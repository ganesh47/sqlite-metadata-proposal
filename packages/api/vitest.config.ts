import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      lines: 80,
      functions: 80,
      branches: 70
    },
    setupFiles: ["./tests/setup.ts"],
    globals: true
  }
});
