/**
 * Copy text to the clipboard via the async Clipboard API.
 *
 * This replaces a vendored gist built on the deprecated `document.execCommand('copy')`.
 * That approach had to inject a hidden <textarea>, clobber the user's existing text
 * selection, lean on four non-null assertions against `document.getSelection()`, and
 * it could not report failure — so the UI always claimed the token had been copied.
 *
 * It also contained outright dead code: `el.contentEditable` and `el.readOnly` were
 * saved from a *freshly created* element (so always the defaults) and restored after
 * that element had already been removed from the DOM.
 *
 * `navigator.clipboard.writeText` needs none of that: no DOM injection, no selection
 * to trample, and it reports failures asynchronously.
 *
 * A legacy `execCommand` fallback is deliberately NOT kept: every browser in this
 * project's browserslist supports the async API ("not dead" excludes IE11 and legacy
 * Safari), and both deploy targets are secure contexts — GitHub Pages serves HTTPS and
 * `vite dev` runs on localhost — so the fallback would only add deprecated surface for
 * browsers this project does not support.
 *
 * @throws {ClipboardUnsupportedError} if the Clipboard API is unavailable (e.g. an
 *         insecure, non-HTTPS context).
 * @throws {Error} if the write is refused — typically a `NotAllowedError` when the
 *         user denies clipboard permission or there is no active user gesture.
 */

/** Thrown when this browser or context exposes no clipboard API at all. */
export class ClipboardUnsupportedError extends Error {
  constructor(
    message = "This browser cannot access the clipboard. The Clipboard API requires a secure (HTTPS or localhost) context.",
  ) {
    super(message);
    this.name = "ClipboardUnsupportedError";
  }
}

/**
 * Resolves once `text` is on the clipboard; rejects if it could not be written so
 * the caller can report an honest failure instead of always claiming success.
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  const clipboard = globalThis.navigator?.clipboard;

  if (typeof clipboard?.writeText !== "function") {
    throw new ClipboardUnsupportedError();
  }

  await clipboard.writeText(text);
};
