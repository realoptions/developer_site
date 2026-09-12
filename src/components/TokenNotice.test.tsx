import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ClipboardUnsupportedError } from "../copyToClipboard.ts";

import { message as antdMessage } from "antd";

const h = vi.hoisted(() => ({ copy: vi.fn(async () => {}) }));
vi.mock("../copyToClipboard.ts", async (io) => {
  const a = await io<typeof import("../copyToClipboard.ts")>();
  return { ...a, copyToClipboard: h.copy };
});
const { default: TokenNotice } = await import("./TokenNotice.tsx");

const msgs = () =>
  [...document.querySelectorAll(".ant-message-notice-content, .ant-message-notice")]
    .map((e) => e.textContent ?? "")
    .join(" | ");

async function clickCopy() {
  const btn = [...document.querySelectorAll("button")].find((b) =>
    b.textContent?.includes("Copy Token"),
  )!;
  btn.click();
}

describe("TokenNotice copy feedback", () => {
  beforeEach(async () => {
    // antd's message API renders into its own portal that outlives unmount(), so a
    // leftover toast could make a later assertion pass vacuously. Clear it, and
    // PROVE each test starts clean.
    // Don't wipe innerHTML: antd caches its message container and a foreign wipe
    // leaves later toasts rendering into a detached node. Use antd's own teardown.
    antdMessage.destroy();
    await expect.poll(() => msgs(), { timeout: 2000 }).toBe("");
  });

  it("tells the user when the token was copied", async () => {
    h.copy.mockResolvedValue(undefined);
    const { unmount } = await render(<TokenNotice token="tok" />);
    await clickCopy();
    await expect.poll(() => msgs()).toContain("Token copied");
    unmount();
  });

  it("tells the user to copy manually when the clipboard is unavailable", async () => {
    h.copy.mockRejectedValue(new ClipboardUnsupportedError("no clipboard"));
    const { unmount } = await render(<TokenNotice token="tok" />);
    await clickCopy();
    await expect.poll(() => msgs()).toContain("Clipboard unavailable");
    unmount();
  });

  it("distinguishes a blocked clipboard from no clipboard at all", async () => {
    h.copy.mockRejectedValue(new Error("NotAllowedError"));
    const { unmount } = await render(<TokenNotice token="tok" />);
    await clickCopy();
    await expect.poll(() => msgs()).toContain("clipboard access was blocked");
    unmount();
  });
});
