import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "antd";
import "./index.css";
import App from "./App.tsx";
import { assertEnv } from "./env.ts";
import { applyThemeCssVars, resolveThemeMode, themeFor } from "./theme.ts";

const root = createRoot(document.getElementById("root") as HTMLElement);

const mode = resolveThemeMode(
  globalThis.localStorage?.getItem("theme"),
  typeof matchMedia === "function"
    ? matchMedia("(prefers-color-scheme: dark)").matches
    : false,
);

// Applied before any render, and outside the try/catch, so the configuration-error
// panel below is themed too rather than arriving unstyled.
applyThemeCssVars(mode);

// Validate configuration before rendering. A deployment missing its API key used
// to come up as a fully rendered page whose auth calls failed for reasons nothing
// on screen explained; now it says what is wrong and how to fix it.
try {
  assertEnv();
  root.render(
    <StrictMode>
      <ConfigProvider theme={themeFor(mode)}>
        <App />
      </ConfigProvider>
    </StrictMode>,
  );
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  root.render(
    <ConfigProvider theme={themeFor(mode)}>
      <div className="config-error">
        <h1>Configuration error</h1>
        <p>{detail}</p>
      </div>
    </ConfigProvider>,
  );
  console.error(detail);
}
