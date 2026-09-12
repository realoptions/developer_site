import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { assertEnv } from "./env.ts";

const root = createRoot(document.getElementById("root") as HTMLElement);

// Validate configuration before rendering. A deployment missing its API key used
// to come up as a fully rendered page whose auth calls failed for reasons nothing
// on screen explained; now it says what is wrong and how to fix it.
try {
  assertEnv();
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  root.render(
    <div className="config-error">
      <h1>Configuration error</h1>
      <p>{detail}</p>
    </div>,
  );
  console.error(detail);
}
