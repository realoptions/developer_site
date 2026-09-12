import { beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Button, ConfigProvider } from "antd";
import { PALETTES, themeFor, type ThemeMode } from "./theme.ts";
import "./index.css";
import "./App.css";

/** `#c41d7f` -> `rgb(196, 29, 127)`, as getComputedStyle reports colours. */
const asRgb = (hex: string) => {
  const [, r, g, b] = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)!;
  return `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`;
};

beforeEach(() => {
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("style");
});

/**
 * The palette and the antd token config are asserted in theme.test.ts. What this
 * file checks is the last mile: that antd's CSS-in-JS actually paints a real
 * rendered button with those tokens. A config object that is correct but not
 * applied would pass every unit test and still ship the wrong colour.
 *
 * Kept in its own file: rendered alongside AppHeader (and its themed antd Menu)
 * in one module, the tests interfere with each other's act() cycles.
 */
describe("antd paints its primary button with the theme", () => {
  for (const mode of ["light", "dark"] as ThemeMode[]) {
    it(`${mode}: background is the brand action colour, label is onAction`, async () => {
      const { container, unmount } = await render(
        <ConfigProvider theme={themeFor(mode)}>
          <Button type="primary">Copy Token</Button>
        </ConfigProvider>,
      );
      const btn = container.querySelector("button.ant-btn-primary");
      if (!btn) throw new Error("primary button did not render");
      const cs = getComputedStyle(btn);
      expect(cs.backgroundColor, `${mode} button bg`).toBe(
        asRgb(PALETTES[mode].action),
      );
      expect(cs.color, `${mode} button label`).toBe(asRgb(PALETTES[mode].onAction));
      unmount();
    });
  }

  it("is not antd's stock blue", async () => {
    // If theming silently stopped applying, this is what we would get. Guards
    // against ConfigProvider being dropped from the tree without anything failing.
    const { container, unmount } = await render(
      <ConfigProvider theme={themeFor("light")}>
        <Button type="primary">Copy Token</Button>
      </ConfigProvider>,
    );
    const bg = getComputedStyle(
      container.querySelector("button.ant-btn-primary")!,
    ).backgroundColor;
    expect(bg).not.toBe("rgb(22, 119, 255)");
    expect(bg).toBe(asRgb(PALETTES.light.action));
    unmount();
  });

  it("an UNTHEMED primary button really is the stock blue", async () => {
    // Negative control for the test above: proves the assertion distinguishes
    // themed from unthemed rather than passing for both.
    const { container, unmount } = await render(
      <Button type="primary">Copy Token</Button>,
    );
    const bg = getComputedStyle(
      container.querySelector("button.ant-btn-primary")!,
    ).backgroundColor;
    expect(bg).toBe("rgb(22, 119, 255)");
    expect(bg).not.toBe(asRgb(PALETTES.light.action));
    unmount();
  });
});
