import { afterEach, describe, expect, it, vi } from "vitest";
import { ClipboardUnsupportedError, copyToClipboard } from "./copyToClipboard.ts";

// `clipboard` normally lives on Navigator.prototype, so defining it as an own
// property shadows it for the test and deleting it restores the real lookup.
const setClipboard = (value: unknown) => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    writable: true,
    value,
  });
};

afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard");
  Reflect.deleteProperty(document, "execCommand");
});

describe("copyToClipboard", () => {
  it("writes the text through the async Clipboard API and resolves", async () => {
    const writeText = vi.fn(async () => undefined);
    setClipboard({ writeText });

    await expect(copyToClipboard("token-123")).resolves.toBeUndefined();

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith("token-123");
  });

  it("rejects when the write is refused, so the caller can report failure", async () => {
    const writeText = vi.fn(async () => {
      throw new DOMException("Permission denied", "NotAllowedError");
    });
    setClipboard({ writeText });

    await expect(copyToClipboard("token-123")).rejects.toThrow(/Permission denied/);

    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it("rejects with ClipboardUnsupportedError when there is no clipboard API", async () => {
    setClipboard(undefined);

    await expect(copyToClipboard("token-123")).rejects.toBeInstanceOf(
      ClipboardUnsupportedError,
    );
  });

  it("does not fall back to the deprecated document.execCommand", async () => {
    // Replace execCommand rather than spy on it, so this does not depend on the
    // browser still exposing the deprecated method.
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      writable: true,
      value: execCommand,
    });
    setClipboard({ writeText: vi.fn(async () => undefined) });

    await copyToClipboard("token-123");

    expect(execCommand).not.toHaveBeenCalled();
  });

  it("does not inject a hidden textarea to perform the copy", async () => {
    const createElement = vi.spyOn(document, "createElement");
    setClipboard({ writeText: vi.fn(async () => undefined) });

    await copyToClipboard("token-123");

    const injectedTextareas = createElement.mock.calls.filter(
      ([tag]) => tag === "textarea",
    );
    expect(injectedTextareas).toHaveLength(0);
  });
});
