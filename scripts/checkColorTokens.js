#!/usr/bin/env node
/**
 * Guard: colour literals belong in src/theme.ts and nowhere else.
 *
 * "Re-theming requires touching only the theme file" is not something you can
 * assert by eye once a codebase grows. This makes it a build failure: any hex or
 * rgb()/rgba() colour outside the theme module fails the check.
 *
 * Test files are exempt - they legitimately assert against specific colours and
 * simulate re-theming with substitute values.
 */
const fs = require("node:fs");
const path = require("node:path");

const SRC = path.join(__dirname, "..", "src");
const ALLOWED = [
  path.join("src", "theme.ts").toLowerCase(),
  path.join("src", "wcag.ts").toLowerCase(),
];

const COLOR_PATTERNS = [
  /#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi,
  /\brgba?\s*\(/gi,
];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__screenshots__") continue;
      yield* walk(full);
    } else if (/\.(css|ts|tsx|js|jsx)$/.test(entry.name)) {
      yield full;
    }
  }
}

const violations = [];

for (const file of walk(SRC)) {
  const rel = path.relative(path.join(__dirname, ".."), file).toLowerCase();
  if (ALLOWED.includes(rel)) continue;
  if (/\.test\.[cm]?[jt]sx?$/.test(rel)) continue;

  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const pattern of COLOR_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        violations.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
    }
  });
}

if (violations.length) {
  console.error(
    "\n[checkColorTokens] Hardcoded colour found outside the theme module.\n" +
      "Brand/accent colours must come from src/theme.ts so re-theming stays a\n" +
      "one-file change. Move the value into the palette and reference it via a\n" +
      "CSS custom property or an antd token.\n\n",
  );
  for (const v of violations) console.error("  " + v);
  console.error(`\n  ${violations.length} violation(s)\n`);
  process.exit(1);
}

console.log("[checkColorTokens] OK - no colour literals outside src/theme.ts");
