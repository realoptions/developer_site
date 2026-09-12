#!/usr/bin/env node
/**
 * Pre-flight check for the generated OpenAPI spec.
 *
 * `src/swagger_spec.json` is git-ignored but imported by `src/App.tsx`. Without it,
 * Vite fails with a bare "Could not resolve ./swagger_spec.json" that tells a new
 * contributor nothing about the actual fix. This script runs as the `prebuild` /
 * `predev` hook so the failure names the remedy instead.
 */
const fs = require("fs");
const path = require("path");

const SPEC_PATH = path.join(__dirname, "..", "src", "swagger_spec.json");
const HOW_TO_FIX = "Run `npm run spec` to generate it (see README.md).";

function fail(problem) {
  console.error(`\n✗ Missing required build input: src/swagger_spec.json`);
  console.error(`  ${problem}`);
  console.error(`  ${HOW_TO_FIX}\n`);
  process.exit(1);
}

if (!fs.existsSync(SPEC_PATH)) {
  fail("The file does not exist. It is generated, not committed.");
}

const raw = fs.readFileSync(SPEC_PATH, "utf8");
if (raw.trim() === "") {
  fail("The file is empty — the previous generation probably failed.");
}

let spec;
try {
  spec = JSON.parse(raw);
} catch (error) {
  fail(`The file is not valid JSON: ${error.message}`);
}

if (!spec || typeof spec !== "object" || Object.keys(spec.paths || {}).length === 0) {
  fail('The file parses but contains no "paths" — it is not a usable OpenAPI document.');
}

console.log(
  `✓ src/swagger_spec.json present (${Object.keys(spec.paths).length} paths, ${raw.length} bytes).`,
);
