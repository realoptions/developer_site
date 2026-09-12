import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

type Cb = (u: unknown) => void;

const state = vi.hoisted(() => {
  const listeners = new Set<(u: never) => void>();
  return {
    listeners,
    fire(u: unknown) {
      [...listeners].forEach((l) => l(u as never));
    },
  };
});

// Spread the real module and override only the two functions this test drives:
// firebase.ts needs getAuth and FirebaseLogin.tsx needs the provider classes.
vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>();
  return {
    ...actual,
    onAuthStateChanged: (_auth: unknown, cb: Cb) => {
      state.listeners.add(cb as (u: never) => void);
      return () => {
        state.listeners.delete(cb as (u: never) => void);
      };
    },
    signOut: vi.fn(async () => {
      state.fire(null);
    }),
  };
});

const { useAuth } = await import("./useAuth.ts");

const fakeUser = (idToken: string) =>
  ({ getIdToken: async () => idToken }) as never;

const Probe = () => {
  const { status, token, error } = useAuth({} as never);
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="token">{token}</span>
      <span data-testid="error">{error ? error.message : ""}</span>
    </div>
  );
};

const q = (c: HTMLElement, k: string) =>
  c.querySelector(`[data-testid="${k}"]`)?.textContent ?? "";

describe("useAuth", () => {
  it("reports loading until Firebase resolves the session, then authenticated", async () => {
    const { container } = await render(<Probe />);

    // The point of the loading state: we must not claim "signed out" yet.
    expect(q(container, "status")).toBe("loading");

    await expect.poll(() => state.listeners.size).toBe(1);
    state.fire(fakeUser("tok-123"));
    await expect
      .poll(() => q(container, "status"))
      .toBe("authenticated");
    expect(q(container, "token")).toBe("tok-123");
    expect(q(container, "error")).toBe("");
  });

  it("reports signed-out when Firebase resolves with no user", async () => {
    const { container } = await render(<Probe />);
    expect(q(container, "status")).toBe("loading");

    await expect.poll(() => state.listeners.size).toBe(1);
    state.fire(null);
    await expect.poll(() => q(container, "status")).toBe("signed-out");
  });

  it("surfaces a token fetch failure instead of presenting an empty token as real", async () => {
    const { container } = await render(<Probe />);

    await expect.poll(() => state.listeners.size).toBe(1);
    state.fire({
      getIdToken: async () => {
        throw new Error("token endpoint unavailable");
      },
    } as never);

    await expect
      .poll(() => q(container, "error"))
      .toContain("token endpoint unavailable");
    // Still signed in, but the token is explicitly empty and the failure is visible.
    expect(q(container, "status")).toBe("authenticated");
    expect(q(container, "token")).toBe("");
  });

  it("unregisters the observer on unmount", async () => {
    const { unmount } = await render(<Probe />);
    expect(state.listeners.size).toBe(1);

    unmount();
    await expect.poll(() => state.listeners.size).toBe(0);
  });
});

describe("import-time side effects (7da invariant)", () => {
  it("importing App.tsx initialises no Firebase app", async () => {
    const { getApps } = await import("firebase/app");
    expect(getApps()).toHaveLength(0);

    await import("../App.tsx");
    expect(getApps()).toHaveLength(0);
  });
});
