import { describe, expect, it } from "vitest";
import {
  BRAND,
  PALETTES,
  cssVariables,
  headerMenuTheme,
  resolveThemeMode,
  themeFor,
  type ThemeMode,
} from "./theme.ts";
import { AA, contrast, parseColor, relativeLuminance } from "./wcag.ts";

describe("wcag maths", () => {
  it("matches the reference ratios", () => {
    // Sanity anchors against the spec's own worked examples.
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrast("#777777", "#ffffff")).toBeGreaterThanOrEqual(4.4);
    // Order must not matter.
    expect(contrast("#123456", "#abcdef")).toBeCloseTo(
      contrast("#abcdef", "#123456"),
      9,
    );
  });

  it("parses 3-, 6- and 8-digit hex", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255]);
    expect(parseColor("#eb2f96")).toEqual([235, 47, 150]);
    expect(parseColor("#0a141e80")).toEqual([10, 20, 30]);
    expect(() => parseColor("rebeccapurple")).toThrow(/not a hex colour/);
  });

  it("luminance is monotonic in brightness for greys", () => {
    const g = (v: number) => relativeLuminance([v, v, v]);
    expect(g(255)).toBeGreaterThan(g(128));
    expect(g(128)).toBeGreaterThan(g(0));
  });
});

describe("every palette clears WCAG AA, in both modes", () => {
  for (const mode of ["light", "dark"] as ThemeMode[]) {
    const p = PALETTES[mode];

    // Header text on the header band.
    it(`${mode}: header text is AA on the header band`, () => {
      const r = contrast(p.headerText, p.headerBg);
      expect(r, `headerText on headerBg`).toBeGreaterThanOrEqual(AA.normalText);
    });

    // Primary button label, in every state. WCAG applies to hover and active too,
    // so a passing resting state is not enough.
    it(`${mode}: primary button label is AA in all three states`, () => {
      const states = {
        rest: contrast(p.onAction, p.action),
        hover: contrast(p.onAction, p.actionHover),
        active: contrast(p.onAction, p.actionActive),
      };
      for (const [name, ratio] of Object.entries(states)) {
        expect(ratio, `primary button ${name}`).toBeGreaterThanOrEqual(
          AA.normalText,
        );
      }
    });

    // The brand mark is non-text content: 3:1 against whatever it sits on.
    it(`${mode}: brand mark clears non-text contrast`, () => {
      expect(contrast(p.accent, p.headerBg)).toBeGreaterThanOrEqual(AA.nonText);
      expect(contrast(p.accent, "#ffffff")).toBeGreaterThanOrEqual(AA.nonText);
    });

    it(`${mode}: themeFor wires the palette into antd tokens`, () => {
      const cfg = themeFor(mode);
      expect(cfg.token?.colorPrimary).toBe(p.action);
      const button = cfg.components?.Button as Record<string, unknown>;
      expect(button.colorPrimary).toBe(p.action);
      expect(button.colorPrimaryHover).toBe(p.actionHover);
      expect(button.colorPrimaryActive).toBe(p.actionActive);
      expect(button.primaryColor).toBe(p.onAction);
    });
  }

  it("documents WHY the accent is not used for buttons", () => {
    // The brand accent on white is 3.90:1: fine for the logo (3:1 non-text),
    // below the 4.5:1 needed for text. This assertion exists so the distinction
    // cannot be "simplified" away by someone reusing BRAND.accent for a button.
    const onWhite = contrast(BRAND.accent, "#ffffff");
    expect(onWhite).toBeGreaterThanOrEqual(AA.nonText);
    expect(onWhite).toBeLessThan(AA.normalText);
  });
});

describe("cssVariables / mode resolution", () => {
  it("exposes every palette colour as a custom property", () => {
    for (const mode of ["light", "dark"] as ThemeMode[]) {
      const vars = cssVariables(mode);
      expect(Object.values(vars)).toContain(PALETTES[mode].accent);
      expect(vars["--brand-action"]).toBe(PALETTES[mode].action);
      expect(vars["--header-bg"]).toBe(PALETTES[mode].headerBg);
      // No variable may be empty - an empty custom property silently unstyles.
      for (const [k, v] of Object.entries(vars)) {
        expect(v, k).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it("an explicit stored choice beats the system preference", () => {
    expect(resolveThemeMode("light", true)).toBe("light");
    expect(resolveThemeMode("dark", false)).toBe("dark");
  });

  it("falls back to the system preference, then light", () => {
    expect(resolveThemeMode(null, true)).toBe("dark");
    expect(resolveThemeMode(null, false)).toBe("light");
    expect(resolveThemeMode("banana", true)).toBe("dark");
  });

  it("the header menu scheme comes from the palette, not a component literal", () => {
    for (const mode of ["light", "dark"] as ThemeMode[]) {
      expect(headerMenuTheme(mode)).toBe(PALETTES[mode].headerMenuTheme);
    }
  });
});
