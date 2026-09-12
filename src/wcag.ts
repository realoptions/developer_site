/**
 * WCAG 2.1 contrast maths. Pure and dependency-free so the test suite can assert
 * that a palette is accessible in CI, rather than trusting that it looks fine.
 *
 * Enforcement lives in the test, not at runtime: a palette that stops clearing AA
 * should fail the build, not degrade a live page.
 */

export type Rgb = readonly [number, number, number];

const srgbToLinear = (channel: number): number => {
  const v = channel / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/** WCAG relative luminance (https://www.w3.org/TR/WCAG21/#relative-luminance). */
export function relativeLuminance([r, g, b]: Rgb): number {
  return (
    0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
  );
}

/** WCAG contrast ratio between two colours: 1 (identical) to 21 (black/white). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Parse `#rgb` / `#rrggbb` / `#rrggbbaa` into 0-255 channels. */
export function parseColor(hex: string): Rgb {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex.trim());
  if (!m) throw new Error(`not a hex colour: ${JSON.stringify(hex)}`);
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export const contrast = (fg: string, bg: string): number =>
  contrastRatio(parseColor(fg), parseColor(bg));

/**
 * WCAG AA minimums.
 *  - normal body text: 4.5:1
 *  - large text (>=24px, or >=18.66px bold) and UI graphics / non-text content: 3:1
 */
export const AA = { normalText: 4.5, largeText: 3.0, nonText: 3.0 } as const;

export const meetsAA = (ratio: number, size: keyof typeof AA = "normalText"): boolean =>
  ratio >= AA[size];
