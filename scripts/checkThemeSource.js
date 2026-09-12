#!/usr/bin/env node
/**
 * Guard: the browser's theme preference is read in exactly one place.
 *
 * `src/theme.ts` owns `localStorage` and `matchMedia` access for theme purposes.
 * Everywhere else must take the already-resolved mode as a value.
 *
 * Why this needs a guard rather than a convention: index.tsx and App.tsx used to
 * each resolve the mode independently, and each wrapped the read differently
 * (`globalThis.localStorage?.getItem` vs `typeof localStorage === "undefined" ?
 * ... : ...`). Both worked, so nothing signalled the duplication - but the two
 * results feed different things (CSS custom properties vs the antd header/menu
 * scheme), so editing one and not the other produces a theme that half-updates.
 * That is a nasty class of bug to diagnose and a cheap one to forbid.
 *
 * Test files are exempt: they legitimately stub storage to drive both branches.
 * readThemeMode takes its environment as an argument specifically so tests do not
 * have to touch real globals.
 */
const fs = require("node:fs");
const path = require("node:path");

const SRC = path.join(__dirname, "..", "src");
const ALLOWED = ["theme.ts"];

const FORBIDDEN = [
  { pattern: /\blocalStorage\b/, name: "localStorage" },
  { pattern: /\bsessionStorage\b/, name: "sessionStorage" },
  { pattern: /\bmatchMedia\b/, name: "matchMedia" },
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
  const base = path.basename(file).toLowerCase();
  if (ALLOWED.includes(base)) continue;
  if (/\.test\.[cm]?[jt]sx?$/.test(base)) continue;

  const rel = path.relative(path.join(__dirname, ".."), file);
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const { pattern, name } of FORBIDDEN) {
      if (pattern.test(line)) {
        violations.push(`${rel}:${i + 1}: ${name} -> ${line.trim()}`);
      }
    }
  });
}

if (violations.length) {
  console.error(
    "\n[checkThemeSource] Browser storage/system-preference access outside src/theme.ts.\n\n" +
      "The theme mode must be read once, in src/theme.ts (readThemeMode), and passed\n" +
      "down as a value. Two components resolving it independently can drift apart:\n" +
      "they feed different sinks (CSS custom properties vs antd tokens), so a\n" +
      "half-updated theme looks like a styling bug rather than a wiring bug.\n\n",
  );
  for (const v of violations) console.error("  " + v);
  console.error(`\n  ${violations.length} violation(s)\n`);
  process.exit(1);
}

console.log(
  "[checkThemeSource] OK - browser theme reads confined to src/theme.ts",
);
