import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import config from "./config.json";

/**
 * Firebase wiring lives here so that *importing* App.tsx performs no side effects.
 *
 * Previously `initializeApp()` / `getAuth()` ran at module scope in App.tsx, which meant:
 *   - merely importing the module performed auth setup;
 *   - the component could not be rendered in a test without live Firebase wiring, and
 *     there was no way to inject a fake or reset state between tests;
 *   - a bad configuration crashed at import time rather than at first use.
 *
 * Non-secret project settings come from src/config.json; the API key is injected at
 * build time from VITE_FirebaseAPIKey (never committed).
 */
const firebaseOptions = {
  ...config,
  apiKey: import.meta.env.VITE_FirebaseAPIKey,
};

let cachedApp: FirebaseApp | undefined;
let cachedAuth: Auth | undefined;

/** Lazily creates (and caches) the default Firebase app. */
export function getFirebaseApp(): FirebaseApp {
  if (!cachedApp) {
    // Reuse an existing instance if one is already present: React StrictMode invokes
    // components twice in development, and a test harness may initialise Firebase itself.
    cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseOptions);
  }
  return cachedApp;
}

/** Lazily creates (and caches) the Auth service for the default Firebase app. */
export function getFirebaseAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = getAuth(getFirebaseApp());
  }
  return cachedAuth;
}
