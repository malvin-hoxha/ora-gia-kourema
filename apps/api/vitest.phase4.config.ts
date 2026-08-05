import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "test/integration/appointments.test.ts",
      "test/integration/stripe-webhook.test.ts",
    ],
    setupFiles: [
      "test/setup/env.ts",
      "test/setup/phase4-mocks.ts",
    ],
    runner: "test/setup/integration-runner.ts",
    fileParallelism: false,
    maxWorkers: 1,
    isolate: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
