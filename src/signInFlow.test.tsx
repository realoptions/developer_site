import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

type Cb = (u: unknown) => void;

const h = vi.hoisted(() => {
  const listeners = new Set<(u: never) => void>();
  return {
    listeners,
    fire(u: unknown) {
      [...listeners].forEach((l) => l(u as never));
    },
    signInWithPopup: vi.fn(async () => {
      throw Object.assign(new Error("The user closed the popup."), {
        code: "auth/popup-closed-by-user",
      });
    }),
  };
});

vi.mock("./firebase.ts", async () => {
  const stubAuth = { __stub: "auth" };
  return { getFirebaseAuth: () => stubAuth };
});

vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>();
  return {
    ...actual,
    onAuthStateChanged: (_a: unknown, cb: Cb) => {
      h.listeners.add(cb as (u: never) => void);
      return () => {
        h.listeners.delete(cb as (u: never) => void);
      };
    },
    signInWithPopup: h.signInWithPopup,
  };
});

const { default: App } = await import("./App.tsx");
const visibleButtons = () =>
  [
    ...document.querySelectorAll(".login-provider-button"),
  ] as HTMLButtonElement[];

const alertText = () =>
  [...document.querySelectorAll(".auth-alert")]
    .map((e) => e.textContent ?? "")
    .join(" | ");

describe("sign-in failure reaches the screen", () => {
  it("clicking a provider, failing, shows the mapped message", async () => {
    const { container } = await render(<App themeMode="light" />);

    // Resolve the session as signed-out so the login panel mounts.
    expect(h.listeners.size).toBe(1);
    h.fire(null);
    await expect
      .poll(() => visibleButtons().length)
      .toBe(3);

    expect(alertText()).toBe("");

    visibleButtons()[0].click();

    await expect.poll(() => h.signInWithPopup.mock.calls.length).toBe(1);

    // Real provider instance reached Firebase - the factory is wired up.
    const [authArg, providerArg] = (h.signInWithPopup.mock.calls[0] ?? []) as
      unknown[] as [unknown, unknown];
    expect(authArg).toBeTruthy();
    expect((providerArg as object).constructor.name).toBe("GoogleAuthProvider");

    // The mapped, actionable sentence is on screen.
    await expect
      .poll(() => alertText())
      .toContain("closed before it finished");
    expect(container.querySelector(".login-panel")).toBeTruthy();
  });

  it("does not stack requests while a popup is in flight", async () => {
    h.signInWithPopup.mockClear();
    const { rerender } = await render(<App themeMode="light" />);
    h.fire(null);
    await expect.poll(() => visibleButtons().length).toBe(3);

    const btns = visibleButtons();
    btns[0].click();
    await expect.poll(() => h.signInWithPopup.mock.calls.length).toBe(1);

    // Others are disabled mid-flight; clicking them must not fire.
    await expect
      .poll(() => visibleButtons().map((b) => b.disabled))
      .toEqual([false, true, true]);
    visibleButtons()[1].click();
    visibleButtons()[2].click();
    await new Promise((r) => setTimeout(r, 50));
    expect(h.signInWithPopup.mock.calls.length).toBe(1);

    // After the failure settles, the buttons are usable again.
    await expect
      .poll(() => visibleButtons().every((b) => !b.disabled))
      .toBe(true);
    void rerender;
  });
});
