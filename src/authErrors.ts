/**
 * Firebase auth error codes translated into something a user can act on.
 *
 * Sign-in failures used to vanish entirely — `signInWithPopup(...)` was called
 * without a `catch`, so a closed popup, a blocked popup, a denied permission or a
 * network failure all produced a screen that simply did nothing.
 *
 * Kept separate from src/authProviders.ts so hooks/useAuth.ts can use it without
 * that module's icon imports entering the hook's runtime graph.
 */
const ERROR_MESSAGES: Record<string, string> = {
  "auth/popup-closed-by-user":
    "The sign-in window was closed before it finished. Try again.",
  "auth/cancelled-popup-request":
    "Sign-in was cancelled. Close the previous prompt and try again.",
  "auth/popup-blocked":
    "Your browser blocked the sign-in popup. Allow popups for this site and try again.",
  "auth/unauthorized-domain":
    "This site's domain is not authorised in the Firebase console for that provider.",
  "auth/account-exists-with-different-credential":
    "That email is already registered with a different sign-in provider.",
  "auth/invalid-credential":
    "That sign-in was rejected. Check the provider account and try again.",
  "auth/network-request-failed":
    "Network error reaching the sign-in provider. Check your connection and try again.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
};

/**
 * Turn an unknown sign-in failure into a user-facing sentence.
 *
 * Falls back to the Firebase message when the code is unrecognised: Firebase's own
 * strings are developer-grade, but still better than swallowing the failure.
 */
export function describeSignInError(cause: unknown): string {
  const wrapper = cause as { code?: unknown; message?: unknown } | null;
  const code = wrapper?.code;
  if (typeof code === "string" && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }
  // Read `message` structurally rather than via `instanceof Error`: a thrown
  // object literal (or a cross-realm FirebaseError) still carries a useful
  // message, whereas String(cause) would collapse it to "[object Object]".
  const detail =
    typeof wrapper?.message === "string" && wrapper.message
      ? wrapper.message
      : String(cause);
  return `Sign-in failed: ${detail}`;
}
