import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// The Express server (port 4000) owns /api; Vite proxies to it in dev.
export default defineConfig({
  plugins: [react()],
  // Polling: file events may not fire on some filesystems, so edits would never reload.
  server: { port: 5173, watch: { usePolling: true, interval: 300 }, proxy: { "/api": "http://localhost:4000" } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: false,
    css: false,
  },
});
