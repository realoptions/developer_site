/**
 * Single source of truth for build-time environment configuration.
 *
 * Vite inlines `import.meta.env.*` at build time, so every read lives here and is
 * typed via the `ImportMetaEnv` augmentation in `vite-env.d.ts`. Nothing else in
 * `src` should touch `import.meta.env` (or `process.env`) directly.
 *
 * Two things this replaces:
 *   - a stale Create React App-era comment pointing at the legacy `process.env`
 *     variable name, which no longer described how the key actually arrived, and
 *   - `VITE_TAG`, which CI appended to `.env` on every deploy while nothing in
 *     `src` ever read it, so the deployed release tag never reached the page.
 *
 * Because Vite replaces those accesses with literals at *transform* time, the
 * values cannot be stubbed at runtime — a test that re-imported this module would
 * still see whatever `.env` happened to exist. The validation below is therefore
 * written as pure functions taking the env as an argument, so every branch stays
 * testable; the live helpers at the bottom just bind them to this build.
 */

/** The app's environment, before normalisation. */
export interface AppEnv {
  /** Firebase web API key. Required in any real deployment. */
  readonly firebaseApiKey: string | undefined;
  /** Release tag stamped by CI; surfaced in the footer. */
  readonly tag: string | undefined;
}

const isFilled = (value: string | undefined): value is string =>
  typeof value === "string" && value.trim() !== "";

// Literal property accesses only — Vite statically replaces these, whereas dynamic
// `import.meta.env[key]` lookups are not reliably inlined.
export const env: AppEnv = {
  firebaseApiKey: import.meta.env.VITE_FirebaseAPIKey,
  tag: import.meta.env.VITE_TAG,
};

/** The required vars that are absent or blank on the supplied env. */
export const findMissingEnvVars = (candidate: AppEnv): string[] =>
  isFilled(candidate.firebaseApiKey) ? [] : ["VITE_FirebaseAPIKey"];

/** Operator-facing message for a set of missing vars. */
export const formatMissingEnvError = (missing: readonly string[]): string =>
  `Missing required environment variable${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}. ` +
  "Copy .env.example to .env and fill it in (see README.md), then restart.";

/** Footer display for the release tag; "dev" when unset. */
export const formatTag = (tag: string | undefined): string =>
  isFilled(tag) ? tag.trim() : "dev";

/* -------------------------------------------------------------------------- */
/* Live helpers, bound to this build's environment.                             */
/* -------------------------------------------------------------------------- */

/** Required vars missing from this build. */
export const missingEnvVars = (): string[] => findMissingEnvVars(env);

/**
 * Fail fast, before rendering, when required configuration is missing.
 *
 * Called from the entry point so a misconfigured deployment says so plainly rather
 * than rendering a page whose auth calls fail for reasons nothing on screen
 * explains.
 */
export const assertEnv = (): void => {
  const missing = missingEnvVars();
  if (missing.length > 0) {
    throw new Error(formatMissingEnvError(missing));
  }
};

/** The Firebase API key, or a throw naming exactly what to fix. */
export const requireFirebaseApiKey = (): string => {
  if (!isFilled(env.firebaseApiKey)) {
    throw new Error(formatMissingEnvError(["VITE_FirebaseAPIKey"]));
  }
  return env.firebaseApiKey;
};

/** Footer display value for this build's release tag. */
export const appTag: string = formatTag(env.tag);
