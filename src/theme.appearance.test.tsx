import { beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import Logo from "./components/Logo.tsx";
import AppHeader from "./components/AppHeader.tsx";
import {
  PALETTES,
  applyThemeCssVars,
  headerMenuTheme,
  themeFor,
  type ThemeMode,
} from "./theme.ts";
import "./index.css";
import "./App.css";

/** `#eb2f96` -> `rgb(235, 47, 150)` as getComputedStyle reports colours. */
const asRgb = (hex: string) => {
  const [, r, g, b] = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)!;
  return `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`;
};

beforeEach(() => {
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("style");
});

const logoFill = () =>
  getComputedStyle(document.querySelector(".logo-primary")!).fill;

describe("the brand colour reaches the SVG through the token", () => {
  for (const mode of ["light", "dark"] as ThemeMode[]) {
    it(`${mode}: logo fill === PALETTES[${mode}].accent`, async () => {
      applyThemeCssVars(mode);
      const { unmount } = await render(<Logo className="logo-primary" />);
      expect(logoFill()).toBe(asRgb(PALETTES[mode].accent));
      unmount();
    });
  }

  it("RE-THEMEING works: overriding the token changes the logo, proving nothing is hardcoded", async () => {
    applyThemeCssVars("light");
    const { unmount } = await render(<Logo className="logo-primary" />);
    const before = logoFill();
    expect(before).toBe(asRgb(PALETTES.light.accent));

    // Simulate "edit the theme file": a new accent, nothing else touched.
    document.documentElement.style.setProperty("--brand-accent", "#00aa88");
    expect(logoFill()).toBe(asRgb("#00aa88"));
    expect(logoFill()).not.toBe(before);
    unmount();
  });

  it("an unset token does NOT silently keep a hardcoded colour", async () => {
    // No applyThemeCssVars call: because App.css declares no fallback hex, the
    // fill resolves to the initial value rather than to the old brand colour.
    const { unmount } = await render(<Logo className="logo-primary" />);
    expect(logoFill()).not.toBe(asRgb(PALETTES.light.accent));
    unmount();
  });
});

describe("the header band is token-driven too", () => {
  for (const mode of ["light", "dark"] as ThemeMode[]) {
    it(`${mode} header background and text come from the palette`, async () => {
      applyThemeCssVars(mode);
      const { unmount } = await render(
        <AppHeader
          showSignOut={true}
          onSignOut={() => {}}
          menuTheme={headerMenuTheme(mode)}
        />,
      );
      const header = document.querySelector(".app-header")!;
      const cs = getComputedStyle(header);
      expect(cs.backgroundColor).toBe(asRgb(PALETTES[mode].headerBg));
      expect(cs.color).toBe(asRgb(PALETTES[mode].headerText));
      unmount();
    });
  }

  it("changing --header-bg restyles the header without touching a component", async () => {
    applyThemeCssVars("light");
    const { unmount } = await render(
      <AppHeader showSignOut={false} onSignOut={() => {}} menuTheme="dark" />,
    );
    const header = document.querySelector(".app-header")!;
    expect(getComputedStyle(header).backgroundColor).toBe(
      asRgb(PALETTES.light.headerBg),
    );
    document.documentElement.style.setProperty("--header-bg", "#2b0a1a");
    expect(getComputedStyle(header).backgroundColor).toBe(asRgb("#2b0a1a"));
    unmount();
  });
});

describe("themeFor returns a usable antd config", () => {
  it("renders inside ConfigProvider with both modes", async () => {
    const { ConfigProvider } = await import("antd");
    for (const mode of ["light", "dark"] as ThemeMode[]) {
      const { unmount } = await render(
        <ConfigProvider theme={themeFor(mode)}>
          <Logo className="logo-primary" />
        </ConfigProvider>,
      );
      applyThemeCssVars(mode);
      expect(logoFill()).toBe(asRgb(PALETTES[mode].accent));
      unmount();
    }
  });
});
