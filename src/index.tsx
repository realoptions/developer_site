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
    <div
      style={{
        maxWidth: "38rem",
        margin: "4rem auto",
        padding: "1.5rem",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
        Configuration error
      </h1>
      <p style={{ margin: 0 }}>{detail}</p>
    </div>,
  );
  console.error(detail);
}
