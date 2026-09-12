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
| `npm run typecheck`   | `tsc -p tsconfig.app.json --noEmit`.                      |
| `npm test`            | Single run of the browser test suite.                     |
| `npm run test:watch`  | Watch mode for the same suite.                            |

There is no lint or format tooling configured in this repo; `typecheck` is the
static gate.

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
and **GitHub** ([`src/FirebaseLogin.tsx`](src/FirebaseLogin.tsx)). After signing
in, the app reads the Firebase ID token and offers a **Copy Token** button; paste
that into Swagger UI's `JWT (apiKey)` box to authenticate requests.

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
npm test
```

Current coverage is focused on the env/validation and clipboard modules plus a
harness smoke test. Run `npm run typecheck` alongside `npm test`; CI enforces both.

## Continuous integration & deployment

- **[`test.yml`](.github/workflows/test.yml)** runs on every push: install →
  `npm run spec` → `npm run typecheck` → install Chromium → `npm test` → build.
- **[`deploy.yml`](.github/workflows/deploy.yml)** runs on push to `master`:
  generates the spec, stamps `VITE_TAG` from `scripts/outputTag`, injects
  `VITE_FirebaseAPIKey` from the `FIREBASE_API_KEY` secret, builds, and publishes
  `dist/` to GitHub Pages.

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
  FirebaseLogin.tsx       Provider sign-in buttons.
  env.ts                  All (typed) environment reads + validation.
  firebase.ts             Lazy, memoised Firebase app/auth singletons.
  copyToClipboard.ts      Async Clipboard API wrapper.
  index.css               Design tokens (spacing scale, header/logo sizes).
  App.css                 App shell layout (flexbox).
  config.json             Non-secret Firebase project settings.
  swagger_spec.json       GENERATED — git-ignored.
scripts/
  downloadYML.js          Fetch + validate the OpenAPI spec.
  checkSpec.js            Preflight guard run before dev/build.
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
