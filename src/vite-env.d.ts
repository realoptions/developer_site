/// <reference types="vite/client" />

/**
 * The build-time variables this app actually uses. Read them through src/env.ts
 * rather than touching import.meta.env directly — that module owns normalisation
 * and validation.
 *
 * Declared optional because the value may legitimately be absent (a fresh clone
 * with no .env); env.ts turns that absence into an actionable error.
 */
interface ImportMetaEnv {
  /** Firebase web API key, injected at build time. Never committed. */
  readonly VITE_FirebaseAPIKey?: string;
  /** Release tag stamped by CI; surfaced in the site footer. */
  readonly VITE_TAG?: string;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  import * as React from "react";

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;

  const src: string;
  export default src;
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.module.sass" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
