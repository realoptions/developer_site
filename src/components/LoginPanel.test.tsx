import { beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Layout } from "antd";
import { AppleOutlined } from "@ant-design/icons";
import LoginPanel from "./LoginPanel.tsx";
import { PROVIDERS, type ProviderConfig } from "../authProviders.ts";
import type { AuthProvider } from "firebase/auth";
import { describeSignInError } from "../authErrors.ts";
import "../index.css";
import "../App.css";

const { Content } = Layout;

const StubIcon = AppleOutlined as unknown as React.ComponentType<{
  style?: React.CSSProperties;
}>;

const buttons = () =>
  [...document.querySelectorAll(".login-provider-button")] as HTMLButtonElement[];

const stub = (key: string, label: string) => ({
  key,
  label,
  Icon: StubIcon,
  create: vi.fn(() => ({ providerId: key }) as AuthProvider),
});

const px = (el: Element, prop: string) =>
  parseFloat(getComputedStyle(el).getPropertyValue(prop)) || 0;

describe("AC1: adding a provider is a config entry, not markup", () => {
  it("renders exactly one button for a one-entry array", async () => {
    await render(
      <LoginPanel
        signIn={vi.fn()}
        pendingProvider={null}
        providers={[stub("x", "Continue with X")]}
      />,
    );
    const b = buttons();
    expect(b).toHaveLength(1);
    expect(b[0].textContent).toContain("Continue with X");
  });

  it("renders one button per entry, for any count", async () => {
    const five = Array.from({ length: 5 }, (_, i) => stub(`p${i}`, `Provider ${i}`));
    await render(
      <LoginPanel signIn={vi.fn()} pendingProvider={null} providers={five} />,
    );
    expect(buttons().map((b) => b.textContent?.trim())).toEqual(
      Array.from({ length: 5 }, (_, i) => `Provider ${i}`),
    );
  });

  it("the shipped config renders all three real providers", async () => {
    await render(<LoginPanel signIn={vi.fn()} pendingProvider={null} />);
    expect(buttons()).toHaveLength(3);
    expect(PROVIDERS.map((p) => p.key)).toEqual(["google", "facebook", "github"]);
  });

  it("passes the whole config entry to signIn, not a fragment", async () => {
    const signIn = vi.fn(async (_p: unknown) => {});
    const p: ProviderConfig = stub("x", "Continue with X");
    await render(
      <LoginPanel signIn={signIn} pendingProvider={null} providers={[p]} />,
    );
    buttons()[0].click();
    await vi.waitFor(() => expect(signIn).toHaveBeenCalledTimes(1));
    expect(signIn.mock.calls[0][0]).toBe(p);
  });
});

describe("AC4: providers constructed on demand, not at import time", () => {
  it("rendering does not construct a provider", async () => {
    const p = stub("lazy", "Lazy");
    await render(
      <LoginPanel signIn={vi.fn()} pendingProvider={null} providers={[p]} />,
    );
    expect(p.create).not.toHaveBeenCalled();
  });

  it("the shipped factories return a FRESH instance per call (no module singletons)", () => {
    for (const p of PROVIDERS) {
      expect(typeof p.create).toBe("function");
      expect(p.create()).not.toBe(p.create());
    }
  });
});

describe("AC2: sign-in failures produce real, actionable text", () => {
  it("closed popup", () => {
    expect(
      describeSignInError(
        Object.assign(new Error("closed"), { code: "auth/popup-closed-by-user" }),
      ),
    ).toContain("closed before it finished");
  });

  it("blocked popup", () => {
    expect(describeSignInError({ code: "auth/popup-blocked" })).toContain(
      "blocked",
    );
  });

  it("network failure", () => {
    expect(describeSignInError({ code: "auth/network-request-failed" })).toContain(
      "Network",
    );
  });

  it("unknown code still surfaces the underlying message", () => {
    const msg = describeSignInError({
      code: "auth/brand-new-code",
      message: "surprise",
    });
    expect(msg).toContain("Sign-in failed");
    expect(msg).toContain("surprise");
    expect(msg).not.toContain("[object Object]");
  });

  it("non-Error throws do not crash or stringify to [object Object]", () => {
    expect(describeSignInError("just a string")).toContain("just a string");
    expect(describeSignInError(null)).toContain("null");
  });
});

describe("pending state guards concurrent popups", () => {
  it("disables every other provider while one is in flight", async () => {
    await render(<LoginPanel signIn={vi.fn()} pendingProvider="facebook" />);
    const b = buttons();
    expect(b.map((x) => x.disabled)).toEqual([true, false, true]);
  });

  it("all enabled when nothing is pending", async () => {
    await render(<LoginPanel signIn={vi.fn()} pendingProvider={null} />);
    expect(buttons().every((b) => !b.disabled)).toBe(true);
  });
});

describe("AC3: centred and usable at 320px and 1920px", () => {
  for (const vw of [320, 375, 768, 1920]) {
    it(`centres inside the content box at ${vw}px`, async () => {
      await page.viewport(vw, 900);
      const { unmount } = await render(
        <Layout className="app-shell">
          <Content className="app-content">
            <LoginPanel signIn={vi.fn()} pendingProvider={null} />
          </Content>
        </Layout>,
      );

      expect(document.documentElement.clientWidth).toBe(vw);

      const content = document.querySelector(".app-content")!;
      const panel = document.querySelector(".login-panel")!;
      const pad = px(content, "padding-left") + px(content, "padding-right");
      const inner = content.clientWidth - pad;

      const c = content.getBoundingClientRect();
      const p = panel.getBoundingClientRect();

      // Centred: gap on the left equals the gap on the right.
      const leftGap = p.left - (c.left + px(content, "padding-left"));
      const rightGap = c.right - px(content, "padding-right") - p.right;
      expect(
        Math.abs(leftGap - rightGap),
        `centre gaps ${leftGap.toFixed(1)} / ${rightGap.toFixed(1)}`,
      ).toBeLessThanOrEqual(1);

      // Width capped by the token on wide screens, fluid on narrow ones.
      const cap = 352; // 22rem
      const expected = Math.min(inner, cap);
      expect(
        Math.abs(p.width - expected),
        `panel ${p.width.toFixed(1)} vs expected ${expected.toFixed(1)}`,
      ).toBeLessThanOrEqual(1);

      const bs = buttons();
      expect(bs).toHaveLength(3);
      for (const b of bs) {
        const r = b.getBoundingClientRect();
        expect(r.left).toBeGreaterThanOrEqual(-1);
        expect(r.right).toBeLessThanOrEqual(vw + 1);
        expect(r.width).toBeGreaterThanOrEqual(p.width - 1);
        expect(r.height).toBeGreaterThanOrEqual(40); // tappable
        expect(b.disabled).toBe(false);
      }

      const de = document.documentElement;
      expect(de.scrollWidth).toBeLessThanOrEqual(de.clientWidth + 1);
      unmount();
    });
  }
});

beforeEach(() => {
  document.body.innerHTML = "";
});
