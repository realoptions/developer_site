#!/usr/bin/env node
/**
 * Bootstrap the OpenAPI spec this app renders.
 *
 * `src/swagger_spec.json` is a GENERATED artifact and is git-ignored, yet `src/App.tsx`
 * imports it. A fresh clone therefore cannot build until this script has been run once:
 *
 *     npm run spec
 *
 * It downloads `openapi_gcp.yml` from the latest release of
 * `realoptions/option_price_faas`, converts it to JSON, and writes it to
 * `src/swagger_spec.json`.
 *
 * A GitHub token is OPTIONAL — it is only needed if the source repo is private or the
 * anonymous API rate limit is being hit:
 *
 *     ACCESS_TOKEN=ghp_xxx npm run spec
 *
 * `scripts/releases.json` (also git-ignored) is fetched automatically when absent, so
 * no manual `curl` step is required.
 */
const fs = require("fs");
const path = require("path");
const { https } = require("follow-redirects");
const yaml = require("js-yaml");

const ROOT = path.resolve(__dirname, "..");
const RELEASES_PATH = path.join(__dirname, "releases.json");
const SPEC_PATH = path.join(ROOT, "src", "swagger_spec.json");

const RELEASE_REPO = "realoptions/option_price_faas";
const RELEASE_API = `https://api.github.com/repos/${RELEASE_REPO}/releases/latest`;
const ASSET_NAME = "openapi_gcp.yml";
const USER_AGENT = "developer_site-spec-bootstrap";

const accessToken = process.env.ACCESS_TOKEN || process.env.access_token;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function get(url) {
  return new Promise((resolve, reject) => {
    const headers = { "User-Agent": USER_AGENT };
    if (accessToken) headers.Authorization = `token ${accessToken}`;
    https
      .get(url, { headers }, (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      })
      .on("error", reject);
  });
}

async function getWithRetry(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await get(url);
      if (response.status >= 200 && response.status < 300) return response;
      const hint =
        response.status === 401 && accessToken
          ? " — ACCESS_TOKEN was rejected."
          : response.status === 403 && !accessToken
            ? " — GitHub rate-limits unauthenticated requests; set ACCESS_TOKEN and retry."
            : response.status === 404
              ? ` — is ${RELEASE_REPO} reachable, and does it have a release?`
              : "";
      lastError = new Error(`HTTP ${response.status} for ${url}${hint}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) await sleep(1000 * attempt);
  }
  throw lastError;
}

/** Load the cached release metadata, fetching it if it is missing or unreadable. */
async function loadRelease() {
  if (fs.existsSync(RELEASES_PATH)) {
    try {
      const cached = JSON.parse(fs.readFileSync(RELEASES_PATH, "utf8"));
      if (cached && Array.isArray(cached.assets)) {
        console.log(`Using cached release metadata: ${cached.tag_name}`);
        return cached;
      }
    } catch {
      console.log("Cached scripts/releases.json is unreadable; re-fetching.");
    }
  }
  console.log(`Fetching latest release metadata from ${RELEASE_REPO}...`);
  const response = await getWithRetry(RELEASE_API);
  const release = JSON.parse(response.body);
  fs.writeFileSync(RELEASES_PATH, response.body, "utf8");
  return release;
}

async function main() {
  const release = await loadRelease();
  const asset = (release.assets || []).find((item) => item.name === ASSET_NAME);
  if (!asset) {
    throw new Error(
      `Release asset "${ASSET_NAME}" not found on ${release.tag_name}. ` +
        `Available: ${(release.assets || []).map((a) => a.name).join(", ") || "none"}`,
    );
  }

  console.log(`Downloading ${ASSET_NAME} (${asset.size} bytes) from ${release.tag_name}...`);
  const download = await getWithRetry(asset.browser_download_url);

  let parsed;
  try {
    parsed = yaml.load(download.body);
  } catch (error) {
    throw new Error(
      `Failed to parse ${ASSET_NAME} as YAML: ${error.message}. ` +
        `The release asset may be corrupt or truncated.`,
    );
  }
  if (!parsed || typeof parsed !== "object" || !parsed.paths) {
    throw new Error(
      `Parsed ${ASSET_NAME} has no "paths" section — this does not look like an OpenAPI document.`,
    );
  }

  fs.writeFileSync(SPEC_PATH, JSON.stringify(parsed), "utf8");
  console.log(
    `Wrote ${SPEC_PATH} (${Object.keys(parsed.paths).length} paths, ` +
      `${fs.statSync(SPEC_PATH).size} bytes). You can now run \`npm run dev\` or \`npm run build\`.`,
  );
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  console.error("  See the header of scripts/downloadYML.js or README.md for details.");
  process.exitCode = 1;
});
