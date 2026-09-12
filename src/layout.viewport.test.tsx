import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Layout } from "antd";
import AppHeader from "./components/AppHeader.tsx";
import AppFooter from "./components/AppFooter.tsx";
import TokenNotice from "./components/TokenNotice.tsx";
import AuthLoading from "./components/AuthLoading.tsx";
import "./index.css";
import "./App.css";

const { Content } = Layout;

const WIDTHS = [320, 375, 414, 768, 1024, 1440, 1920];

const box = async (sel: string) => {
  const el = document.querySelector(sel) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    left: r.left,
    right: r.right,
    top: r.top,
    bottom: r.bottom,
    width: r.width,
    height: r.height,
    // Content wider than the box means it is being clipped.
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  };
};

const viewport = () => document.documentElement.clientWidth;

/** The widest thing on the page must not exceed the viewport. */
const assertNoDocOverflow = () => {
  const de = document.documentElement;
  expect(de.scrollWidth, "document horizontal overflow").toBeLessThanOrEqual(
    de.clientWidth + 1,
  );
};

for (const width of WIDTHS) {
  describe(`header + footer at ${width}px`, () => {
    it("does not overflow, clip, or overlap", async () => {
      await page.viewport(width, 900);
      const { unmount } = await render(
        <Layout className="app-shell">
          <AppHeader showSignOut onSignOut={() => {}} />
          <Content className="app-content">
            <TokenNotice token="tok" />
          </Content>
          <AppFooter />
        </Layout>,
      );

      const vw = viewport();
      expect(vw, "viewport applied").toBe(width);

      const header = await box(".app-header");
      const logo = await box(".app-logo");
      const menu = await box(".app-menu");
      const footer = await box(".app-footer");
      expect(header, "header rendered").toBeTruthy();
      expect(logo, "logo rendered").toBeTruthy();
      expect(menu, "menu rendered").toBeTruthy();
      expect(footer, "footer rendered").toBeTruthy();

      // Nothing hangs off either edge.
      expect(header!.left, "header left").toBeGreaterThanOrEqual(-1);
      expect(header!.right, "header right").toBeLessThanOrEqual(vw + 1);
      expect(footer!.right, "footer right").toBeLessThanOrEqual(vw + 1);
      expect(logo!.left, "logo left").toBeGreaterThanOrEqual(-1);
      expect(menu!.right, "menu right").toBeLessThanOrEqual(vw + 1);

      // The brand and the menu never overlap - the old floats allowed this.
      expect(logo!.right, "logo must not overlap menu").toBeLessThanOrEqual(
        menu!.left + 1,
      );

      // The logo stays inside the header band (no vertical clipping).
      expect(logo!.top).toBeGreaterThanOrEqual(header!.top - 1);
      expect(logo!.bottom).toBeLessThanOrEqual(header!.bottom + 1);

      // No horizontal clipping of the header or footer content.
      expect(header!.scrollWidth).toBeLessThanOrEqual(header!.clientWidth + 1);
      expect(footer!.scrollWidth).toBeLessThanOrEqual(footer!.clientWidth + 1);

      assertNoDocOverflow();
      unmount();
    });
  });
}

describe("loading and signed-out views stay inside the viewport", () => {
  for (const width of [320, 768, 1920]) {
    it(`renders at ${width}px`, async () => {
      await page.viewport(width, 900);
      const { unmount } = await render(
        <Layout className="app-shell">
          <AppHeader showSignOut={false} onSignOut={() => {}} />
          <Content className="app-content">
            <AuthLoading />
          </Content>
          <AppFooter />
        </Layout>,
      );
      assertNoDocOverflow();
      const loading = await box(".auth-loading");
      expect(loading, "loading view rendered").toBeTruthy();
      expect(loading!.right).toBeLessThanOrEqual(viewport() + 1);
      unmount();
    });
  }
});

describe("config error page", () => {
  it("wraps a long message without horizontal overflow at 320px", async () => {
    await page.viewport(320, 900);
    const long =
      "Missing required environment variables: VITE_FirebaseAPIKey. Copy .env.example to .env and fill it in.";
    const { unmount } = await render(
      <div className="config-error">
        <h1>Configuration error</h1>
        <p>{long}</p>
      </div>,
    );
    assertNoDocOverflow();
    const p = await box(".config-error p");
    expect(p!.right).toBeLessThanOrEqual(321);
    unmount();
  });
});
