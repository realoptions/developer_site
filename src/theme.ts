import { theme as antdTheme } from "antd";
import type { ThemeConfig } from "antd";

/**
 * THE single source of truth for colour in this app.
 *
 * Everything brand- or accent-coloured derives from this file: antd's component
 * tokens, the CSS custom properties our own stylesheet consumes, and the logo
 * fill. Re-skinning the app means editing this file and nothing else - a
 * mechanical check in the test suite fails if a colour literal reappears
 * anywhere else in `src`.
 */

export type ThemeMode = "light" | "dark";

/**
 * Brand family.
 *
 * `accent` is the brand mark colour. On white it is 3.90:1, which clears WCAG's
 * 3:1 bar for non-text content but NOT the 4.5:1 bar for text - so it is used
 * for the logo and decoration only, never as a text or button background.
 *
 * `action*` are the interactive surfaces, chosen as a darker member of the same
 * family so white label text clears AA in every state, hover and active included
 * (WCAG applies to hover, not just rest).
 */
export const BRAND = {
  accent: "#eb2f96",
  action: "#c41d7f",
  actionHover: "#cb2a88",
  actionActive: "#9e1068",
  onAction: "#ffffff",
} as const;

export interface Palette {
  /** Decorative brand mark / focus accents. Not for text. */
  accent: string;
  /** Primary action surface, and its hover / active states. */
  action: string;
  actionHover: string;
  actionActive: string;
  /** Label colour on the primary action surface. */
  onAction: string;
  /** Header band and its text. */
  headerBg: string;
  headerText: string;
  /** Menu colour scheme inside the header band. */
  headerMenuTheme: "light" | "dark";
}

export const PALETTES: Record<ThemeMode, Palette> = {
  light: {
    ...BRAND,
    // A dark branded band on a light page, as the app has always shipped. Kept
    // deliberately: the ticket is about where colour is *defined*, not about
    // restyling what users already recognise.
    headerBg: "#001529",
    headerText: "#ffffff",
    headerMenuTheme: "dark",
  },
  dark: {
    ...BRAND,
    headerBg: "#141b22",
    headerText: "#ffffff",
    headerMenuTheme: "dark",
  },
};

/** CSS custom properties consumed by our own stylesheet (see App.css). */
export function cssVariables(mode: ThemeMode): Record<string, string> {
  const p = PALETTES[mode];
  return {
    "--brand-accent": p.accent,
    "--brand-action": p.action,
    "--brand-action-hover": p.actionHover,
    "--brand-action-active": p.actionActive,
    "--brand-on-action": p.onAction,
    "--header-bg": p.headerBg,
    "--header-text": p.headerText,
  };
}

export function applyThemeCssVars(
  mode: ThemeMode,
  root: HTMLElement = document.documentElement,
): void {
  const vars = cssVariables(mode);
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
  root.dataset.theme = mode;
}

/**
 * antd theme for a mode. Component tokens are pinned explicitly rather than left
 * to antd's derived algorithm, because the AA guarantee depends on the exact
 * hover/active values and should not shift when antd changes its derivation.
 */
export function themeFor(mode: ThemeMode): ThemeConfig {
  const p = PALETTES[mode];
  const isDark = mode === "dark";
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: p.action,
      colorLink: p.action,
    },
    components: {
      Button: {
        colorPrimary: p.action,
        colorPrimaryHover: p.actionHover,
        colorPrimaryActive: p.actionActive,
        primaryColor: p.onAction,
        primaryShadow: "none",
      },
    },
  };
}

/** Menu scheme for the header band, so components carry no colour decision. */
export function headerMenuTheme(mode: ThemeMode): "light" | "dark" {
  return PALETTES[mode].headerMenuTheme;
}

/**
 * Resolve the mode to render: an explicit stored choice wins, otherwise the
 * operating system's preference, otherwise light.
 *
 * Pure on purpose - it takes its inputs rather than reaching for browser globals,
 * so both branches are testable without stubbing anything.
 */
export function resolveThemeMode(
  stored?: string | null,
  prefersDark?: boolean,
): ThemeMode {
  if (stored === "light" || stored === "dark") return stored;
  return prefersDark ? "dark" : "light";
}

export const THEME_STORAGE_KEY = "theme";

/** Injectable so `readThemeMode` can be tested without touching real globals. */
export interface ThemeEnv {
  getItem: (key: string) => string | null;
  prefersDark: () => boolean;
}

/**
 * Read the theme mode from the browser.
 *
 * This is the ONLY place in `src/` allowed to touch `localStorage` or
 * `matchMedia` - scripts/checkThemeSource.js enforces it. Before this, index.tsx
 * and App.tsx each resolved the mode independently (with two different defensive
 * idioms for the same read), so a future edit to one could leave the CSS custom
 * properties and the antd header/menu scheme disagreeing.
 *
 * The safety nets sit at the CALL SITE rather than inside the default helpers, so
 * they protect an injected implementation just as well as the built-in one.
 * Safari in private mode throws on `localStorage` access rather than returning
 * null; an uncaught throw here would stop the app rendering at all.
 */
export function readThemeMode(env?: Partial<ThemeEnv>): ThemeMode {
  const getItem =
    env?.getItem ??
    ((key: string): string | null =>
      typeof localStorage === "undefined" ? null : localStorage.getItem(key));

  const prefersDark =
    env?.prefersDark ??
    ((): boolean =>
      typeof matchMedia === "function" &&
      matchMedia("(prefers-color-scheme: dark)").matches);

  let stored: string | null = null;
  try {
    stored = getItem(THEME_STORAGE_KEY);
  } catch {
    stored = null;
  }

  let systemPrefersDark = false;
  try {
    systemPrefersDark = prefersDark();
  } catch {
    systemPrefersDark = false;
  }

  return resolveThemeMode(stored, systemPrefersDark);
}
