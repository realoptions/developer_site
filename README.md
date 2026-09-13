# Finside developer site

Public developer portal for the Finside options-pricing API. Sign in with an
identity provider, copy your issued token into Swagger's `JWT (apiKey)` box, and
browse and exercise the API against the live OpenAPI spec.

## Stack

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Build / dev    | [Vite 8](https://vite.dev) + `@vitejs/plugin-react`  |
| UI             | React 19, [antd 6](https://ant.design), `@ant-design/icons` |
| API docs       | `swagger-ui-react` 5                                |
| Auth           | Firebase 12 (`firebase/auth`)                       |
| Language       | TypeScript 5.9 (strict; `noUnusedLocals`)           |
| Tests          | Vitest 4 in **real-browser** mode (Playwright/Chromium) |
| Hosting        | GitHub Actions → GitHub Pages                       |

## Prerequisites

- **Node 24**, as pinned in [`.nvmrc`](.nvmrc) (`nvm use` picks it up).
  `package.json` allows `^22.12.0 || >=24.0.0`; Node 23 is deliberately excluded.
- **npm >= 10**.
- A Firebase project with the Google, Facebook and GitHub providers enabled, and a
  web app API key (see [Configuration](#configuration)).

## Quick start

```bash
npm ci
cp .env.example .env      # then fill in VITE_FirebaseAPIKey
npm run spec              # generates src/swagger_spec.json (git-ignored)
npm run dev               # http://localhost:5173
```

`npm run spec` is a required step, not an optional extra — see
[The OpenAPI spec](#the-openapi-spec-generated-git-ignored). `npm run dev` and
`npm run build` both run `scripts/checkSpec.js` first, so a missing spec fails
with that remedy rather than an unresolved-import error.

## Commands

| Command               | What it does                                              |
| --------------------- | --------------------------------------------------------- |
| `npm run dev`         | Dev server with HMR (runs the spec preflight first).       |
| `npm run build`       | Production build to `dist/` (runs the spec preflight first). |
| `npm run preview`     | Serve the built `dist/` locally.                          |
| `npm run spec`        | Download the OpenAPI spec and write it as JSON.           |
| `npm run verify`      | The whole gate: guards + typecheck + tests.                |
| `npm run lint`        | Both source guards (`lint:colors` + `lint:theme`).         |
| `npm run typecheck`   | `tsc -p tsconfig.app.json --noEmit`.                      |
| `npm test`            | Single run of the browser test suite.                     |
| `npm run test:watch`  | Watch mode for the same suite.                            |
| `npm run test:coverage` | Same suite with V8 coverage.                             |
| `npm run lint:colors` | Fails on any colour literal outside `src/theme.ts`.       |

`npm run verify` is the one command that answers "is this safe to ship?". It is
what CI runs, and both CI workflows call it rather than restating the steps, so
the local gate and the deployed gate cannot drift. It deliberately does **not**
include `build`: the deploy build step stamps `VITE_TAG` and
`VITE_FirebaseAPIKey` into `.env` first, and a build inside `verify` would
produce an artifact without them.

> **Not Create React App.** This project was migrated to Vite. The legacy CRA
> scripts and the `build/` output directory from those docs are gone; only the
> commands in the table above are supported.

## Configuration

All environment reads live in **[`src/env.ts`](src/env.ts)**, typed via the
`ImportMetaEnv` declaration in `src/vite-env.d.ts`. Nothing else in `src` touches
`import.meta.env`. Copy `.env.example` and fill it in; `.env` is git-ignored.

| Variable             | Required | Purpose                                                  |
| -------------------- | -------- | -------------------------------------------------------- |
| `VITE_FirebaseAPIKey`| **Yes**  | Firebase web API key. Firebase console → Project settings → Your apps → Web app. |
| `VITE_TAG`           | No       | Release tag shown in the site footer. Written by CI; locally the footer reads `dev`. |

Non-secret Firebase project settings are committed in
[`src/config.json`](src/config.json); only the API key is injected at build time.

Only variables prefixed `VITE_` reach the browser bundle. `VITE_FirebaseAPIKey` is
validated **before render** by `assertEnv()` in
[`src/index.tsx`](src/index.tsx) — a misconfigured build shows a readable
"Configuration error" panel instead of a page whose auth calls fail silently.

## The OpenAPI spec (generated, git-ignored)

`src/swagger_spec.json` is imported directly by `src/App.tsx` but is
**git-ignored**, so it does not exist in a fresh clone.

```bash
npm run spec                        # anonymous — usually fine
ACCESS_TOKEN=ghp_xxx npm run spec   # only if rate-limited
```

`scripts/downloadYML.js` fetches `openapi_gcp.yml` from the latest
[`realoptions/option_price_faas`](https://github.com/realoptions/option_price_faas)
release and writes it as JSON. It validates the YAML and its `paths` **before**
writing, so a failed run cannot clobber a good spec. `ACCESS_TOKEN` is optional
(the asset is public) and is read from the real process environment — nothing loads
`.env` into Node.

`npm run spec` also writes `scripts/releases.json`, whose `tag_name`
`scripts/outputTag` reports at deploy time. That tag is the **`option_price_faas`
release** (e.g. `v0.22.0`) — not this site's own `package.json` version.

## Authentication

Three providers are wired up via Firebase popup sign-in: **Google**, **Facebook**
and **GitHub** ([`src/authProviders.ts`](src/authProviders.ts)). After signing
in, the app reads the Firebase ID token and offers a **Copy Token** button; paste
that into Swagger UI's `JWT (apiKey)` box to authenticate requests.

### Adding a sign-in provider

Append one entry to the `PROVIDERS` array in `src/authProviders.ts`:

```ts
{
  key: "microsoft",
  label: "Continue with Microsoft",
  Icon: WindowsOutlined,
  create: () => new OAuthProvider("microsoft.com"),
}
```

That is the whole change. The login panel maps over the array, so no component,
markup or layout edit is needed, and the new button inherits the existing width,
centreing, pending-state and error handling.

Providers are built by `create()` **at sign-in time**, never at import. Besides
keeping module import side-effect free, this gives every attempt a fresh provider,
so a cancelled popup cannot leave stale scopes or custom parameters behind for the
next one.

Failures are translated into a user-visible sentence via
`describeSignInError` ([`src/authErrors.ts`](src/authErrors.ts)); add a case to
`ERROR_MESSAGES` there if you want a custom string for a new Firebase error code.
Unrecognised codes still surface their underlying message rather than going silent.

Clipboard copying goes through the async Clipboard API
([`src/copyToClipboard.ts`](src/copyToClipboard.ts)), so it requires a secure
context (HTTPS or localhost) and reports failures rather than always claiming
success. Sign-in popups additionally need a real user gesture and providers
actually enabled in your Firebase project.

## Local API backend

In development, requests to `/api` are proxied to a locally running backend at
`http://localhost:8000/api/` (see `server.proxy` in
[`vite.config.ts`](vite.config.ts)). Start the pricing service separately if you
want to exercise endpoints.

## Testing

Tests run in a **real Chromium browser** under
[`vitetest.config.ts`](vitetest.config.ts) (`@vitest/browser-playwright`), not jsdom.

```bash
npx playwright install --with-deps chromium   # once
npm test                                     # the suite
npm run test:coverage                        # same, with a coverage report
```

A failing test exits non-zero and therefore fails the CI build. So does a run that
collects **zero** tests — the suite cannot quietly become empty and still report
green.

### What the suite covers

| File | Covers |
| --- | --- |
| `hooks/useAuth.test.tsx` | Auth state machine: loading vs authenticated vs signed-out, token fetch failure, unsubscribe on unmount, and the invariant that importing `App` creates no Firebase app |
| `components/LoginPanel.test.tsx` | Providers are data-driven: one button per config entry, lazy provider construction, pending-state, centring from 320px to 1920px |
| `signInFlow.test.tsx` | End to end through the real `App`: a click reaches `signInWithPopup` with a real provider, and a failure surfaces a readable message |
| `components/AppHeader.test.tsx` | Brand mark, and that the Log Out item tracks session state and fires exactly once |
| `components/TokenNotice.test.tsx` | Copy success, unavailable clipboard, blocked clipboard |
| `layout.viewport.test.tsx` | Header/footer geometry from 320px to 1920px: no overflow, no clipping |
| `copyToClipboard.test.ts` | Async Clipboard API wrapper and its unsupported-context error |
| `env.test.ts` | Env validation helpers |
| `harness.test.ts` | Proves the browser harness and matchers are actually wired up |

### Gotchas when writing tests here

Each of these cost real debugging time; they are properties of this setup, not of
your test.

- **`await render(...)`.** Rendering is async in this harness; skipping `await`
  queries the DOM before anything is in it.
- **Effects do not flush synchronously.** After a render, poll for the state you
  expect with `await expect.poll(() => ...)` rather than asserting immediately.
- **Set viewports with `page.viewport(w, h)`** from `vitest/browser`. Playwright's
  `page.setViewportSize` does not exist here, and importing `page` from the older
  `@vitest/browser/context` path is deprecated and will break in the next major.
- **antd `message` outlives `unmount()`.** It renders into its own portal, so a
  toast from one test can satisfy the next test's assertion while proving nothing.
  Call `message.destroy()` in `beforeEach` and assert the area is empty first. Do
  *not* reset by wiping `document.body.innerHTML` — antd caches that container and
  later toasts render into a detached node that never appears.
- **A test that cannot fail is worse than no test.** Where an assertion matters,
  break the thing it guards and confirm the test goes red. Both the responsive and
  the copy-feedback tests were only trusted after that exercise — and the copy
  feedback tests turned out to be passing vacuously before it.

## Continuous integration & deployment

- **[`test.yml`](.github/workflows/test.yml)** runs on every push: install →
  `npm run spec` → install Chromium → `npm run verify` → build.
- **[`deploy.yml`](.github/workflows/deploy.yml)** runs on push to `master` as
  three jobs: `test` → `build` → `deploy`. The `test` job runs the same
  `npm run verify` gate, and `build` declares `needs: test`, so a failing suite
  stops the artifact being uploaded and published rather than merely reporting a
  red tick on a separate workflow.

The gate is enforced by exit codes, not by watching: a failing test exits 1, a run
matching zero test files also exits 1 (a silently-empty suite cannot pass), and
nothing in either workflow uses `continue-on-error`, `|| true` or `if: always()`.

Tests pass without a `.env`, which matters because `.env` is git-ignored and CI
has none.

Required repository secrets: `FIREBASE_API_KEY`, and `ACCESS_TOKEN` (optional,
GitHub API rate-limit relief for the spec download).

## Repository layout

```
src/
  index.tsx               Entry point; validates env before render.
  App.tsx                 Composition root: wires useAuth to the components.
  hooks/useAuth.ts        Auth state machine: loading / authenticated / signed-out.
  components/
    AppHeader.tsx         Header: brand mark + sign-out menu.
    AppFooter.tsx         Footer with the deployed release tag.
    AuthLoading.tsx       Rendered while the session is unresolved.
    TokenNotice.tsx       Token explanation + Copy Token action.
    ApiDocs.tsx           Swagger UI wrapper.
    Logo.tsx              Brand mark.
    LoginPanel.tsx        Sign-in buttons, rendered from the provider array.
  authProviders.ts        Sign-in provider config array (add a provider here).
  authErrors.ts           Firebase auth error codes -> user-facing messages.
  env.ts                  All (typed) environment reads + validation.
  firebase.ts             Lazy, memoised Firebase app/auth singletons.
  copyToClipboard.ts      Async Clipboard API wrapper.
  theme.ts                EVERY brand/accent colour, per light/dark mode.
  wcag.ts               Contrast maths used to assert the palette is AA.
  index.css               Design tokens (spacing scale, header/logo sizes).
  App.css                 App shell layout (flexbox).
  config.json             Non-secret Firebase project settings.
  swagger_spec.json       GENERATED — git-ignored.
scripts/
  downloadYML.js          Fetch + validate the OpenAPI spec.
  checkSpec.js            Preflight guard run before dev/build.
  checkColorTokens.js     Fails the build on any colour literal outside theme.ts.
  outputTag.js            Print the release tag from releases.json.
  releases.json           GENERATED — git-ignored. Release metadata from the last spec run.
```

## Styling

Layout is flexbox. The spacing scale and layout dimensions live as CSS custom
properties in `src/index.css` (`--space-xs` … `--space-4xl`, `--header-height`,
`--logo-size`, and the fluid `--gutter`), and that file is the only place those
numbers are written down.

Reference the tokens instead of restating literals:

```css
.app-content { padding-inline: var(--gutter); }   /* good  */
.app-content { padding-inline: 50px; }           /* bad   */
```

`--gutter` is a `clamp()`, so header, content and footer share one horizontal
rhythm that tightens on phones and widens on desktops without breakpoint
bookkeeping.

### Colour

**`src/theme.ts` is the only file in `src/` that contains a colour literal.** It
defines the brand palette per light/dark mode and feeds it to both consumers:

- antd components, via `<ConfigProvider theme={themeFor(mode)}>` in `src/index.tsx`
- our own stylesheet, via CSS custom properties applied to the document element
  by `applyThemeCssVars(mode)`

Re-skinning the app means editing `theme.ts` and nothing else. `npm run
lint:colors` (also run by `predev`/`prebuild` and CI) fails the build if a hex or
`rgb()` value reappears anywhere else in `src`, so the invariant cannot rot.

```css
.logo-primary { fill: var(--brand-accent); }   /* good */
.logo-primary { fill: #eb2f96; }              /* fails lint:colors */
```

There is deliberately **no fallback value** in `var(...)`. A fallback would keep
the old colour alive when a token is missing, which is how a hardcoded value
smuggles itself back in.

**The brand colour is not the button colour.** `BRAND.accent` (`#eb2f96`) is
3.90:1 on white: enough for the logo (WCAG asks 3:1 of non-text content), not
enough for text. `BRAND.action` (`#c41d7f`) is the same hue darkened until white
label text clears 4.5:1 — in **all three states** (rest 5.48, hover 4.97,
active 7.70), because WCAG applies to hover and active too, not just rest.
`src/theme.test.ts` asserts every pair in both modes, so a palette edit that
breaks contrast fails CI rather than shipping an unreadable button. `wcag.ts` is
the contrast maths behind that check; it is not used at runtime.

Mode resolution lives in `readThemeMode()`, which is the **only** place in `src/`
permitted to touch `localStorage` or `matchMedia`. It is read once in
`src/index.tsx` and passed down as a value — components receive the resolved mode
instead of deriving it, because two components independently resolving it feed
different sinks (CSS custom properties vs antd tokens) and a half-updated theme
reads as a styling bug rather than the wiring bug it is.

`npm run lint:theme` enforces that: any `localStorage`, `sessionStorage` or
`matchMedia` reference outside `src/theme.ts` fails the build. `readThemeMode`
takes its environment as an optional argument so tests can drive both branches
without stubbing globals, and its throw-handling sits at the call site — Safari in
private mode throws on storage *access* rather than returning null, and an
uncaught throw there would stop the app rendering at all.

## Troubleshooting

**`Could not resolve "./swagger_spec.json"`, or the prebuild check fails.**
The generated spec is missing or empty. Run `npm run spec`.

**The page shows "Configuration error".**
`VITE_FirebaseAPIKey` is unset. `cp .env.example .env`, fill it in, restart.

**Tests fail to launch a browser.**
Chromium isn't installed: `npx playwright install --with-deps chromium`.

**"optimized dependencies changed. reloading" on a cold test/dev run.**
Vite's dependency optimizer re-bundling mid-session. The second run is clean; it
is a harness artefact, not an application fault.

**Copy works in dev but not when opened over plain HTTP.**
Expected: the Clipboard API requires a secure context. Use HTTPS or `localhost`.
