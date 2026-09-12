import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import AppHeader from "./AppHeader.tsx";
import "../index.css";
import "../App.css";

const menuItems = () =>
  [
    ...document.querySelectorAll(".app-menu .ant-menu-item"),
  ] as HTMLLIElement[];

const clickMenu = (label: string) => {
  const item = menuItems().find((el) => el.textContent?.includes(label));
  if (!item) throw new Error(`no menu item labelled ${label}`);
  item.click();
};

describe("brand", () => {
  it("renders the logo in the leading slot", async () => {
    await render(<AppHeader showSignOut={false} onSignOut={vi.fn()} menuTheme="dark" />);
    expect(document.querySelector(".app-logo svg")).toBeTruthy();
    // Logo applies the theme hook to its inner <g> (whose fill the paths
    // inherit), not to the <svg> element itself.
    expect(document.querySelector(".app-logo .logo-primary")).toBeTruthy();
  });
});

describe("the sign-out control tracks session state", () => {
  it("offers Log Out once there is a session to end", async () => {
    await render(<AppHeader showSignOut={true} onSignOut={vi.fn()} menuTheme="dark" />);
    const items = menuItems();
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain("Log Out");
  });

  it("offers no menu item when nobody is signed in", async () => {
    await render(<AppHeader showSignOut={false} onSignOut={vi.fn()} menuTheme="dark" />);
    // Nothing to sign out of: an empty menu is not the same as a hidden one.
    expect(menuItems()).toHaveLength(0);
  });

  it("invokes onSignOut exactly once per click", async () => {
    const onSignOut = vi.fn();
    await render(<AppHeader showSignOut={true} onSignOut={onSignOut} menuTheme="dark" />);
    await clickMenu("Log Out");
    await vi.waitFor(() => expect(onSignOut).toHaveBeenCalledTimes(1));
  });

  it("clicking with no session cannot fire onSignOut", async () => {
    const onSignOut = vi.fn();
    await render(<AppHeader menuTheme="dark" showSignOut={false} onSignOut={onSignOut} />);
    expect(menuItems()).toHaveLength(0);
    await new Promise((r) => setTimeout(r, 30));
    expect(onSignOut).not.toHaveBeenCalled();
  });
});

describe("header geometry (signed-in, the wider case)", () => {
  for (const vw of [320, 768, 1920]) {
    it(`stays inside the viewport at ${vw}px`, async () => {
      await page.viewport(vw, 900);
      const { unmount } = await render(
        <AppHeader showSignOut={true} onSignOut={vi.fn()} menuTheme="dark" />,
      );

      const header = document.querySelector(".app-header")!;
      const logo = document.querySelector(".app-logo")!;
      const menu = document.querySelector(".app-menu")!;
      const h = header.getBoundingClientRect();
      const l = logo.getBoundingClientRect();
      const m = menu.getBoundingClientRect();

      // Brand leads, menu trails: no overlap regardless of antd's overflow handling.
      expect(l.right).toBeLessThanOrEqual(m.left + 1);
      // The whole band is on screen.
      expect(h.left).toBeGreaterThanOrEqual(-1);
      expect(h.right).toBeLessThanOrEqual(vw + 1);
      unmount();
    });
  }

  it("keeps the header band at the --header-height token", async () => {
    await page.viewport(1440, 900);
    const { unmount } = await render(
      <AppHeader showSignOut={true} onSignOut={vi.fn()} menuTheme="dark" />,
    );
    const header = document.querySelector(".app-header")!;
    const token =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--header-height",
        ),
      ) || 64;
    expect(header.getBoundingClientRect().height).toBeCloseTo(token, 0);
    unmount();
  });
});
