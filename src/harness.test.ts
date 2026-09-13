import { describe, expect, it } from "vitest";

// Harness smoke test: guards the wiring this repo was missing.
// If setupFiles/@testing-library-jest-dom registration breaks, the matcher
// below stops existing and this test fails loudly instead of silently skipping.
describe("test harness", () => {
  it("runs in a real browser DOM", () => {
    expect(typeof document).toBe("object");
    expect(document.body).toBeTruthy();
  });

  it("has jest-dom matchers registered via src/setupTests.js", () => {
    const el = document.createElement("p");
    el.textContent = "harness ready";
    document.body.append(el);

    expect(el).toHaveTextContent("harness ready");
    expect(el).toBeVisible();

    el.remove();
  });
});
