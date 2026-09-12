/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['./src/setupTests.js'],
    browser: {
      // Vitest 4 takes a provider factory, not a string.
      provider: playwright(),
      enabled: true,
      headless: true,
      // at least one instance is required
      instances: [{ browser: "chromium" }],
    },
    coverage: {
      include: ["src"],
    },
  },
});
