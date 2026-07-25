import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./test/setupEnv.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["prisma/**", "test/**", "dist/**"],
    },
  },
});
