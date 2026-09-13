import { useCallback, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "../firebase.ts";
import { describeSignInError } from "../authErrors.ts";
import type { ProviderConfig } from "../authProviders.ts";

/** `loading` covers the window before Firebase reports the persisted session. */
export type AuthStatus = "loading" | "authenticated" | "signed-out";

export interface UseAuth {
  /** The underlying Firebase Auth instance, for sign-in buttons. */
  readonly auth: Auth;
  readonly user: User | null;
  /** Firebase ID token; empty until fetched, and on fetch failure. */
  readonly token: string;
  readonly status: AuthStatus;
  /** Most recent auth failure, so a component can render it. */
  readonly error: Error | null;
  /** Key of the provider whose popup is currently in flight, else `null`. */
  readonly pendingProvider: string | null;
  readonly signOut: () => Promise<void>;
  /** Start a popup sign-in with one configured provider. */
  readonly signIn: (provider: ProviderConfig) => Promise<void>;
}

const asError = (cause: unknown): Error =>
  cause instanceof Error ? cause : new Error(String(cause));

/**
 * Owns Firebase auth state so the components stay presentational.
 *
 * Before this, the auth observer, the token fetch and the signed-in/out branching
 * all lived inline in the component, and a failed `getIdToken` ended in a catch
 * block that only wrote the error to the developer console, while the UI rendered a
 * signed-in shell holding an empty token — so "Copy Token" cheerfully copied
 * nothing and nothing on screen told the user why.
 *
 * `injectedAuth` exists so a test can supply a fake instead of live Firebase
 * wiring. Nothing is initialised at module scope: `getFirebaseAuth()` is a lazy,
 * memoised singleton, so merely importing this hook stays side-effect free.
 */
export function useAuth(injectedAuth?: Auth): UseAuth {
  const auth = useMemo(() => injectedAuth ?? getFirebaseAuth(), [injectedAuth]);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState<Error | null>(null);
  // Firebase delivers the persisted session asynchronously. Until that first
  // callback lands we cannot tell "signed out" from "still resolving", and the
  // old code guessed "signed out", flashing the login screen at returning users.
  const [sessionResolved, setSessionResolved] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!nextUser) {
        setToken("");
        setUser(null);
        setSessionResolved(true);
        return;
      }

      nextUser
        .getIdToken(true)
        .then((idToken) => {
          setError(null);
          setToken(idToken);
          setUser(nextUser);
        })
        .catch((cause: unknown) => {
          const failure = asError(cause);
          // Keep the user signed in, but surface the failure instead of silently
          // presenting an empty token as if it were real.
          setError(failure);
          setToken("");
          setUser(nextUser);
        })
        .finally(() => setSessionResolved(true));
    });

    // Unregister the observer on unmount.
    return unsubscribe;
  }, [auth]);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setError(null);
    } catch (cause: unknown) {
      setError(asError(cause));
    }
  }, [auth]);

  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  const signIn = useCallback(
    async (provider: ProviderConfig) => {
      // A popup can only be in flight once; ignore re-entry rather than stacking
      // requests that Firebase would cancel anyway.
      if (pendingProvider !== null) {
        return;
      }
      setPendingProvider(provider.key);
      setError(null);
      try {
        // Built here, not at import time.
        await signInWithPopup(auth, provider.create());
        setError(null);
      } catch (cause: unknown) {
        // Popups are closed and cancelled routinely, so a rejection here is a
        // normal user action rather than an exceptional one - but it must never
        // be silent, which is exactly what the old fire-and-forget did.
        setError(new Error(describeSignInError(cause)));
      } finally {
        setPendingProvider(null);
      }
    },
    [auth, pendingProvider],
  );

  const status: AuthStatus = !sessionResolved
    ? "loading"
    : user
      ? "authenticated"
      : "signed-out";

  return {
    auth,
    user,
    token,
    status,
    error,
    pendingProvider,
    signOut,
    signIn,
  };
}
