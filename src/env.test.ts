import { describe, expect, it } from "vitest";
import {
  appTag,
  findMissingEnvVars,
  formatMissingEnvError,
  formatTag,
  missingEnvVars,
  requireFirebaseApiKey,
} from "./env.ts";

// The validation logic is pure and takes the env as an argument precisely so these
// cases are exhaustive and hermetic. Reading import.meta.env directly could not be
// stubbed: Vite bakes those values in at transform time, so such a test would
// depend on whatever local .env happened to exist.

describe("findMissingEnvVars", () => {
  it("reports nothing missing when the Firebase key is set", () => {
    expect(
      findMissingEnvVars({ firebaseApiKey: "test-api-key", tag: "v1.2.3" }),
    ).toEqual([]);
  });

  it("reports VITE_FirebaseAPIKey when it is blank or whitespace", () => {
    expect(findMissingEnvVars({ firebaseApiKey: "", tag: undefined })).toEqual([
      "VITE_FirebaseAPIKey",
    ]);
    expect(
      findMissingEnvVars({ firebaseApiKey: "   ", tag: undefined }),
    ).toEqual(["VITE_FirebaseAPIKey"]);
  });

  it("reports VITE_FirebaseAPIKey when it is absent", () => {
    expect(
      findMissingEnvVars({ firebaseApiKey: undefined, tag: "v1.2.3" }),
    ).toEqual(["VITE_FirebaseAPIKey"]);
  });

  it("never treats a missing tag as an error", () => {
    expect(
      findMissingEnvVars({ firebaseApiKey: "key", tag: undefined }),
    ).toEqual([]);
  });
});

describe("formatMissingEnvError", () => {
  it("names the missing variable", () => {
    expect(formatMissingEnvError(["VITE_FirebaseAPIKey"])).toContain(
      "VITE_FirebaseAPIKey",
    );
  });

  it("points at the committed template and the README", () => {
    const message = formatMissingEnvError(["VITE_FirebaseAPIKey"]);
    expect(message).toContain(".env.example");
    expect(message).toContain("README.md");
  });

  it("is singular for one var and plural for several", () => {
    expect(formatMissingEnvError(["VITE_FirebaseAPIKey"])).toContain("variable:");
    expect(formatMissingEnvError(["A", "B"])).toContain("variables: A, B");
  });
});

describe("formatTag", () => {
  it("trims and surfaces the CI release tag", () => {
    expect(formatTag("  v9.9.9  ")).toBe("v9.9.9");
  });

  it('falls back to "dev" when the tag is absent or blank', () => {
    expect(formatTag(undefined)).toBe("dev");
    expect(formatTag("")).toBe("dev");
    expect(formatTag("   ")).toBe("dev");
  });
});

describe("live bindings", () => {
  it("stay consistent with their pure counterparts", async () => {
    const { env } = await import("./env.ts");

    expect(missingEnvVars()).toEqual(findMissingEnvVars(env));
    expect(appTag).toBe(formatTag(env.tag));
  });

  it("expose a non-empty footer tag regardless of configuration", () => {
    expect(appTag.trim()).not.toBe("");
  });

  it("requireFirebaseApiKey returns a key or throws the template message", () => {
    if (missingEnvVars().length === 0) {
      expect(requireFirebaseApiKey().trim()).not.toBe("");
    } else {
      expect(requireFirebaseApiKey).toThrow(/\.env\.example/);
    }
  });
});
