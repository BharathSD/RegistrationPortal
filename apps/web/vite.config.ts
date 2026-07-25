import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Point straight at the workspace package's TS source rather than its
      // compiled CJS dist/ output: Rollup's commonjs interop can't reliably
      // statically resolve named exports through this package's
      // `export * from "./constants/..."` barrel chain, which surfaces as
      // spurious "X is not exported by ..." build errors. esbuild (which
      // Vite uses for dev/transform) has no such issue with the TS source.
      "@cricket-platform/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
  server: {
    port: 5173,
  },
});
