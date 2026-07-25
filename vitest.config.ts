import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/load-env.ts"],
    testTimeout: 20000,
  },
});
