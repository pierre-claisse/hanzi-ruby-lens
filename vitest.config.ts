import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Mirror the Tauri shims aliased in vite.config.ts so test imports
      // resolve to the same drop-in modules.
      "@tauri-apps/api/core": fileURLToPath(
        new URL("./src/tauriShim/core.ts", import.meta.url),
      ),
      "@tauri-apps/api/window": fileURLToPath(
        new URL("./src/tauriShim/window.ts", import.meta.url),
      ),
      "@tauri-apps/plugin-dialog": fileURLToPath(
        new URL("./src/tauriShim/dialog.ts", import.meta.url),
      ),
      "@tauri-apps/plugin-clipboard-manager": fileURLToPath(
        new URL("./src/tauriShim/clipboard.ts", import.meta.url),
      ),
      "@tauri-apps/plugin-opener": fileURLToPath(
        new URL("./src/tauriShim/opener.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
