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
      // Explicit extension list rather than a bare "src". The directory also holds
      // JSON data (config.json, swagger_spec.json) that v8 tries to parse as a
      // module, fails, and drops from the report. That made the denominator depend
      // on parse behaviour instead of on what is actually source code: the same
      // tree measured over 207 statements in one run and 191 in another. A ratchet
      // is only worth having if it ratchets a stable set of files.
      include: ["src/**/*.ts", "src/**/*.tsx"],
      // Vitest excludes test files from the denominator by default; restated so
      // the measured set is spelled out next to the numbers it produces.
      exclude: ["src/**/*.test.*", "src/jest-dom.d.ts", "src/vite-env.d.ts"],

      // Ratchet floors, not goals. Each value is the ACTUAL measured number
      // rounded DOWN to a whole percent, so this gate encodes where coverage is
      // today and fails if it slips. An aspirational number here would be worse
      // than none: it would fail on every run until someone, under pressure, sets
      // it to whatever makes CI green - and the floor would land below where we
      // already are.
      //
      // Measured on HEAD, vitest run --coverage, deterministic across repeat runs:
      //   statements  83.76%  (160/191)  -> floor 83   (0.76pp headroom)
      //   branches    81.17%  ( 69/ 85)  -> floor 81   (0.17pp headroom)
      //   functions   85.71%  ( 48/ 56)  -> floor 85   (0.71pp headroom)
      //   lines       83.88%  (151/180)  -> floor 83   (0.88pp headroom)
      //
      // The gap between floor and actual is deliberately visible above. When you
      // raise coverage, raise the floor with it and update the measured line -
      // the floor only protects what it tracks.
      thresholds: {
        statements: 83,
        branches: 81,
        functions: 85,
        lines: 83,
      },
    },
  },
});
