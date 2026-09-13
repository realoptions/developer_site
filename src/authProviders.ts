import type { ComponentType, CSSProperties } from "react";
import {
  FacebookAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  type AuthProvider,
} from "firebase/auth";
import {
  FacebookFilled,
  GithubFilled,
  GoogleOutlined,
} from "@ant-design/icons";

/**
 * A sign-in option rendered by the login screen.
 *
 * Adding a provider means appending ONE entry to `PROVIDERS` below. No component,
 * no JSX, no layout change: the login panel maps over this array, so the markup is
 * written once and never grows with the number of providers. Previously each
 * provider had its own hand-written `<Row><Col>` block, which meant copy-pasting
 * markup (and its three empty spacer columns) for every new provider.
 */
export interface ProviderConfig {
  /** Stable identity for React keys and pending-state tracking. */
  readonly key: string;
  readonly label: string;
  readonly Icon: ComponentType<{ style?: CSSProperties }>;
  /**
   * Build the Firebase provider at sign-in time.
   *
   * A factory, not an instance: the old module constructed all three
   * `*AuthProvider`s at import time, so merely importing the login screen
   * allocated Firebase objects. Keeping this lazy also gives each sign-in attempt a
   * fresh provider, so a cancelled popup cannot leave stale scope/parameter state
   * behind for the next attempt.
   */
  readonly create: () => AuthProvider;
}

export const PROVIDERS: readonly ProviderConfig[] = [
  {
    key: "google",
    label: "Continue with Google",
    Icon: GoogleOutlined,
    create: () => new GoogleAuthProvider(),
  },
  {
    key: "facebook",
    label: "Continue with Facebook",
    Icon: FacebookFilled,
    create: () => new FacebookAuthProvider(),
  },
  {
    key: "github",
    label: "Continue with GitHub",
    Icon: GithubFilled,
    create: () => new GithubAuthProvider(),
  },
];
