import { afterEach, describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY, readThemeMode } from "./theme.ts";

/**
 * `readThemeMode` accepts an injected environment, and those branches are covered
 * in theme.test.ts. That leaves the DEFAULT closures - the ones `src/index.tsx`
 * actually executes - untested, because injection bypasses them entirely.
 *
 * These run in a real browser (this project's Vitest is browser-only), so they
 * exercise the genuine `localStorage` / `matchMedia` code path rather than a
 * stand-in.
 */
describe("readThemeMode via the real browser globals", () => {
  afterEach(() => localStorage.removeItem(THEME_STORAGE_KEY));

  it("reads a real stored value with no arguments passed", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readThemeMode()).toBe("dark");
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(readThemeMode()).toBe("light");
  });

  it("with nothing stored, follows the real system preference", () => {
    const expected = matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    expect(readThemeMode()).toBe(expected);
  });

  it("an unrecognised stored value falls through to the real system", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "chartreuse");
    const expected = matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    expect(readThemeMode()).toBe(expected);
  });

  it("the value it returns is always a usable ThemeMode", () => {
    for (const v of [null, "", "dark", "light", "DARK", "0"]) {
      if (v === null) localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, v);
      expect(["light", "dark"]).toContain(readThemeMode());
    }
  });
});
